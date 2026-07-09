'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Menu, Bell, BellOff, Share2, MessageCircle, Facebook, Instagram, Twitter, Loader2, X, Phone, Mail, Clock, ChevronRight, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import { useSearch } from '@/contexts/SearchContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchPayloadCategories, getCategoryDisplayName, getCategoryRouteKey } from '@/utils/payloadCategories'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { getDisplayDateAfterRollover, getRelativeTime } from '@/utils/dateUtils'
import { PUBLIC_CACHE_CHECK_INTERVAL } from '@/utils/queryConfig'
import SearchResults from './SearchResults'

const MENU_CATEGORY_LIMIT  = 12
const ALERTS_LIMIT         = 4               // only latest 4 shown in panel
const ALERTS_POLL_INTERVAL = PUBLIC_CACHE_CHECK_INTERVAL
const ALERTS_CACHE_TTL     = PUBLIC_CACHE_CHECK_INTERVAL - 5 * 1000
const POPUP_DISMISS_DELAY  = 7000
const LAST_SEEN_KEY  = 'br_alert_last_seen'
const MUTED_KEY      = 'br_alert_muted'
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || ''
const CONTACT_PHONE_LABEL = process.env.NEXT_PUBLIC_CONTACT_PHONE_LABEL || CONTACT_PHONE
// ── Sound engine (Web Audio API — no external files needed) ──────────────────
// Generates a pleasant two-tone "ding-dong" chime.
// Only plays AFTER the first user interaction (satisfies browser autoplay policy).
let _userInteracted = false
if (typeof window !== 'undefined') {
  const markInteracted = () => { _userInteracted = true }
  window.addEventListener('click',     markInteracted, { once: true, passive: true })
  window.addEventListener('keydown',   markInteracted, { once: true, passive: true })
  window.addEventListener('touchstart',markInteracted, { once: true, passive: true })
  window.addEventListener('scroll',    markInteracted, { once: true, passive: true })
}

function playAlertSound() {
  if (!_userInteracted) return                  // browser blocks audio before interaction
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx  = new AudioCtx()
    const now  = ctx.currentTime

    // Helper: schedule one tone burst
    const tone = (freq, startAt, duration, peakGain = 0.25) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startAt)
      gain.gain.setValueAtTime(0, startAt)
      gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.02)  // quick attack
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration) // smooth decay
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startAt)
      osc.stop(startAt + duration + 0.05)
    }

    // "Ding" — high note
    tone(1047, now,        0.45, 0.28)   // C6
    tone(1319, now + 0.02, 0.40, 0.15)   // E6  (subtle harmony)
    // "Dong" — lower note, slight delay
    tone(784,  now + 0.28, 0.55, 0.22)   // G5

    // Close the AudioContext once the sound finishes
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch { /* silently ignore: unsupported browser */ }
}

// ── helpers ──────────────────────────────────────────────────────────────────
const getLastSeen = () => {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(LAST_SEEN_KEY) } catch { return null }
}
const setLastSeen = (id) => {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LAST_SEEN_KEY, String(id)) } catch {}
}

// ── New-article popup toast ───────────────────────────────────────────────────
function NewAlertPopup({ count, article, lang, onDismiss, onNavigate }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-5 right-4 z-[100] w-full max-w-xs sm:max-w-sm overflow-hidden rounded-xl border border-red-100 bg-white shadow-2xl"
      style={{ animation: 'brSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}
    >
      <style>{`
        @keyframes brSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes brShrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between bg-red-600 px-3 py-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 fill-white text-white" />
          <span className="text-white text-xs font-bold">
            {lang === 'en'
              ? `${count} New ${count === 1 ? 'Article' : 'Articles'}!`
              : `${count} नई खबर${count > 1 ? 'ें' : ''}!`}
          </span>
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
        </div>
        <button
          onClick={onDismiss}
          className="rounded p-0.5 text-white/80 transition-colors hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Latest article preview */}
      {article && (
        <button
          onClick={() => { onNavigate(article.slug); onDismiss() }}
          className="group flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-red-50"
        >
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {article.image_url ? (
              <img
                src={article.image_url}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
                <Zap className="h-5 w-5 text-red-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
              {lang === 'en' ? 'Latest' : 'ताज़ा खबर'}
            </p>
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800 transition-colors group-hover:text-red-600">
              {article.title}
            </p>
            {article.created_at && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />
                {getRelativeTime(article.created_at)}
              </p>
            )}
          </div>
          <ChevronRight className="mt-5 h-4 w-4 flex-shrink-0 text-gray-300 transition-colors group-hover:text-red-500" />
        </button>
      )}

      {/* Auto-dismiss progress bar */}
      <div className="h-1 bg-red-100">
        <div
          className="h-full origin-left bg-red-500"
          style={{ animation: `brShrink ${POPUP_DISMISS_DELAY}ms linear forwards` }}
        />
      </div>
    </div>
  )
}

// ── Alert dropdown panel ──────────────────────────────────────────────────────
function AlertPanel({ articles, unreadCount, lang, isMuted, onToggleMute, onClose, onRead }) {
  const router = useRouter()
  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  const handleArticleClick = (slug) => {
    onRead()
    onClose()
    router.push(getLangPath(`/news/${encodeURIComponent(slug)}`))
  }

  return (
    <div className="fixed inset-x-3 top-10 z-[60] max-h-[calc(100vh-3.5rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-[calc(100vw-2rem)]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-red-600 text-white">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 fill-white" />
          <span className="font-bold text-sm">
            {lang === 'en' ? 'News Alerts' : 'समाचार अलर्ट'}
          </span>
          {unreadCount > 0 && (
            <span className="bg-white text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
            title={isMuted
              ? (lang === 'en' ? 'Unmute alert sound' : 'अलर्ट साउंड चालू करें')
              : (lang === 'en' ? 'Mute alert sound' : 'अलर्ट साउंड बंद करें')
            }
            aria-label={isMuted
              ? (lang === 'en' ? 'Unmute alert sound' : 'अलर्ट साउंड चालू करें')
              : (lang === 'en' ? 'Mute alert sound' : 'अलर्ट साउंड बंद करें')
            }
          >
            {isMuted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            <span>{isMuted ? (lang === 'en' ? 'Muted' : 'म्यूट') : (lang === 'en' ? 'Sound' : 'साउंड')}</span>
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
            aria-label="Close alerts"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Articles list */}
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
          <Bell className="w-10 h-10 text-gray-200" />
          <p className="text-gray-500 text-sm font-medium">
            {lang === 'en' ? 'No new alerts' : 'कोई नया अलर्ट नहीं'}
          </p>
          <p className="text-gray-400 text-xs">
            {lang === 'en' ? 'You\'re all caught up!' : 'सभी खबरें पढ़ ली हैं!'}
          </p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 sm:max-h-[70vh]">
          {articles.map((article, idx) => (
            <button
              key={article.id}
              type="button"
              onClick={() => handleArticleClick(article.slug)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 mt-0.5">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-red-400" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {idx < unreadCount && (
                    <span className="inline-flex items-center gap-0.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none animate-pulse">
                      <span className="w-1 h-1 bg-white rounded-full inline-block" />
                      {lang === 'en' ? 'New' : 'नई'}
                    </span>
                  )}
                  {article.category && (
                    <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                      {article.category}
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                  {article.title}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-gray-400">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[11px]">{getRelativeTime(article.created_at)}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 flex-shrink-0 mt-4 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex items-center justify-between">
        <button
          onClick={() => { onRead(); onClose() }}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors font-medium"
        >
          {lang === 'en' ? 'Mark all read' : 'सभी पढ़ा हुआ मार्क करें'}
        </button>
        <button
          onClick={() => {
            onRead()
            onClose()
            router.push(lang === 'en' ? '/en/news' : '/news')
          }}
          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
        >
          {lang === 'en' ? 'View all news' : 'सभी समाचार देखें'}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ── Main Header ───────────────────────────────────────────────────────────────
function Header() {
  const [isMenuOpen,   setIsMenuOpen]   = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [isAlertOpen,  setIsAlertOpen]  = useState(false)
  const [unreadCount,  setUnreadCount]  = useState(0)
  const [isMuted,      setIsMuted]      = useState(false)
  const [isScrolled,   setIsScrolled]   = useState(false)
  const [currentTime,  setCurrentTime]  = useState('')
  const [currentDate,  setCurrentDate]  = useState('')
  const [alertPopup,   setAlertPopup]   = useState(null) // { count, article }
  const latestArticleIdRef = useRef(null)  // newest article ID from last poll
  const isAlertInitRef     = useRef(false) // true after first data load
  const isMutedRef         = useRef(false) // sync of isMuted for use inside effects
  const popupTimerRef      = useRef(null)

  const router   = useRouter()
  const pathname = usePathname()
  const { t, lang, toggleLanguage } = useLanguage()

  const menuRef  = useRef(null)
  const alertRef = useRef(null)

  const { searchQuery, handleSearchInputChange, handleSearchSubmit, searchLoading } = useSearch()

  // ── Restore mute pref from localStorage ───────────────────────────────────
  useEffect(() => {
    try { setIsMuted(localStorage.getItem(MUTED_KEY) === '1') } catch {}
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      isMutedRef.current = next
      try { localStorage.setItem(MUTED_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  // ── Live clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const locale = lang === 'en' ? 'en-IN' : 'hi-IN'
    const updateDateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
      setCurrentDate(
        getDisplayDateAfterRollover(now).toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }
    updateDateTime()
    const timer = setInterval(updateDateTime, 1000)
    return () => clearInterval(timer)
  }, [lang])

  // ── Sticky shadow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Close menus on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setIsAlertOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Close menu on route change ─────────────────────────────────────────────
  useEffect(() => { setIsMenuOpen(false); setIsAlertOpen(false) }, [pathname])

  // ── Category nav ──────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'header-menu', MENU_CATEGORY_LIMIT],
    queryFn: () => fetchPayloadCategories({ limit: MENU_CATEGORY_LIMIT }),
    staleTime: 10 * 60 * 1000,
  })

  // ── Alert articles - visible-tab polling
  // • ALERTS_CACHE_TTL < ALERTS_POLL_INTERVAL so each timed poll
  //   bypasses the module-level in-memory cache and hits the network.
  // • refetchOnWindowFocus: false prevents the query from firing on every click,
  //   which would race with the bell toggle and cause spurious re-renders.
  const { data: alertArticles = [] } = useQuery({
    queryKey: ['header-alerts', lang],
    queryFn: async () => {
      const result = await fetchPayloadArticles({
        limit: ALERTS_LIMIT,
        sort: '-publishedAt',
        lang,
        summary: true,
        ttl: ALERTS_CACHE_TTL,
      })
      return result.articles || []
    },
    staleTime: ALERTS_CACHE_TTL,
    refetchInterval: ALERTS_POLL_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // ── markAllRead — defined before handleOpenAlerts so the closure resolves ──
  const markAllRead = useCallback(() => {
    if (alertArticles.length) {
      setLastSeen(alertArticles[0].id)
      setUnreadCount(0)
    }
  }, [alertArticles])

  // ── Toggle alert panel ─────────────────────────────────────────────────────
  const handleOpenAlerts = useCallback(() => {
    setIsAlertOpen(prev => {
      const opening = !prev
      if (opening && alertArticles.length) markAllRead()
      return opening
    })
    setIsMenuOpen(false)
    setIsSocialOpen(false)
  }, [alertArticles, markAllRead])

  // ── Single effect: unread count + new-article detection + sound + popup ────
  useEffect(() => {
    if (!alertArticles.length) return

    const newestId = String(alertArticles[0].id)

    if (!isAlertInitRef.current) {
      // First load — initialise silently, no sound/popup
      isAlertInitRef.current     = true
      latestArticleIdRef.current = newestId
      isMutedRef.current         = isMuted  // capture initial mute state

      const lastSeen = getLastSeen()
      if (!lastSeen) {
        setLastSeen(newestId)
        setUnreadCount(0)
      } else {
        const idx = alertArticles.findIndex(a => String(a.id) === String(lastSeen))
        setUnreadCount(idx === -1 ? alertArticles.length : idx)
      }
      return
    }

    // Subsequent polls — compare newest ID to detect truly new articles
    const hasNew = newestId !== latestArticleIdRef.current
    latestArticleIdRef.current = newestId

    const lastSeen = getLastSeen()
    const idx      = lastSeen
      ? alertArticles.findIndex(a => String(a.id) === String(lastSeen))
      : -1
    const newCount = idx === -1 ? alertArticles.length : idx
    setUnreadCount(newCount)

    if (hasNew && newCount > 0) {
      if (!isMutedRef.current) playAlertSound()
      setAlertPopup({ count: newCount, article: alertArticles[0] })
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
      popupTimerRef.current = setTimeout(() => setAlertPopup(null), POPUP_DISMISS_DELAY)
    }
  }, [alertArticles]) // isMuted read via ref — intentionally not a dependency

  // Cleanup popup timer on unmount
  useEffect(() => () => { if (popupTimerRef.current) clearTimeout(popupTimerRef.current) }, [])

  const dismissPopup = useCallback(() => {
    setAlertPopup(null)
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
  }, [])

  const goToArticle = useCallback((slug) => {
    router.push(lang === 'en' ? `/en/news/${encodeURIComponent(slug)}` : `/news/${encodeURIComponent(slug)}`)
    markAllRead()
  }, [router, lang, markAllRead])

  // ── Nav helpers ────────────────────────────────────────────────────────────
  const getLangPath = (path) => lang === 'en' ? `/en${path}` : path

  const mainCategories = [
    { name: t.header.mainNews, href: getLangPath('/') },
    ...categories.slice(0, MENU_CATEGORY_LIMIT).map(cat => ({
      name: getCategoryDisplayName(cat, lang),
      href: getLangPath(`/category/${encodeURIComponent(getCategoryRouteKey(cat))}`),
    }))
  ]

  const getShareData = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = typeof document !== 'undefined' ? document.title : 'Bullet Reporter'
    const text = `${title} - Bullet Reporter`
    return { url, title, text }
  }

  const getShareHref = (platform) => {
    const { url, text } = getShareData()
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(text)

    switch (platform) {
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      case 'x':
        return `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
      default:
        return url || '/'
    }
  }

  const handleShareClick = async (event, platform) => {
    setIsSocialOpen(false)
    if (platform !== 'instagram') return

    const shareData = getShareData()
    event.preventDefault()
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard && shareData.url) {
      try {
        await navigator.clipboard.writeText(shareData.url)
      } catch {}
    }
  }

  const socialLinks = [
    { name: 'WhatsApp',  icon: MessageCircle, platform: 'whatsapp',  color: 'text-green-600' },
    { name: 'Facebook',  icon: Facebook,      platform: 'facebook',  color: 'text-blue-600' },
    { name: 'Instagram', icon: Instagram,     platform: 'instagram', color: 'text-pink-600' },
    { name: 'X',         icon: Twitter,       platform: 'x',         color: 'text-gray-950' },
  ]

  const isActive = (href) => {
    const cleanHref = href.replace(/^\/en/, '') || '/'
    const cleanPath = (pathname || '').replace(/^\/en/, '') || '/'
    if (cleanHref === '/') return cleanPath === '/'
    return cleanPath.startsWith(cleanHref)
  }

  const handleNavClick = (href) => {
    router.push(href)
    setIsMenuOpen(false)
  }

  return (
    <header className="relative" ref={menuRef}>

      {/* ── Top Bar ── */}
      <div className="bg-red-700 text-white text-xs">
        <div className="container mx-auto px-3 py-1.5 sm:px-4">
          <div className="flex items-center justify-between gap-2 sm:gap-3">

            {/* Left: Date + Time */}
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium leading-none sm:gap-3 sm:text-xs">
              {currentDate && (
                <span className="hidden max-w-[52vw] truncate opacity-85 sm:inline">
                  {currentDate}
                </span>
              )}
              {currentTime && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-2 py-1 tracking-normal text-white/95">
                  {currentTime}
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[11px] font-bold leading-none text-white transition-colors hover:bg-white/20 sm:text-xs"
                aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              >
                {lang === 'en' ? 'हिंदी' : 'English'}
              </button>

              {/* ── News Alert Bell ── */}
              <div className="relative flex items-center" ref={alertRef}>
                {/* Bell button */}
                <button
                  type="button"
                  onClick={handleOpenAlerts}
                  className={`relative flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                    isAlertOpen ? 'bg-red-800' : 'hover:bg-red-800'
                  }`}
                  aria-label={lang === 'en' ? 'News Alerts' : 'समाचार अलर्ट'}
                >
                  {/* Bell with wiggle animation when there are unreads */}
                  <span className={`relative inline-flex ${unreadCount > 0 ? 'animate-[wiggle_0.8s_ease-in-out]' : ''}`}>
                    <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'fill-white' : ''}`} />
                    {/* Unread count badge */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-black text-red-800 leading-none shadow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:inline">{t.header.newsAlerts}</span>
                </button>

                {/* Alert dropdown */}
                {isAlertOpen && (
                  <AlertPanel
                    articles={alertArticles}
                    unreadCount={unreadCount}
                    lang={lang}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    onClose={() => setIsAlertOpen(false)}
                    onRead={markAllRead}
                  />
                )}
              </div>

              {/* Social Share Dropdown */}
              <div className="relative">
                <button
                  className="hover:bg-red-800 p-1.5 rounded transition-colors"
                  onClick={() => setIsSocialOpen(!isSocialOpen)}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                {isSocialOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 font-medium">
                      {t.home?.share || 'Share'}
                    </div>
                    {socialLinks.map((s) => (
                      <a key={s.name} href={getShareHref(s.platform)}
                        target={s.platform === 'instagram' ? undefined : '_blank'}
                        rel={s.platform === 'instagram' ? undefined : 'noopener noreferrer'}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 transition-colors"
                        onClick={(event) => handleShareClick(event, s.platform)}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                        <span className="text-gray-700 text-sm font-medium">{s.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact icons */}
              {CONTACT_PHONE && (
                <a href={`tel:${CONTACT_PHONE}`} className="hidden lg:flex hover:bg-red-800 p-1.5 rounded transition-colors" title={CONTACT_PHONE_LABEL}>
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
              {CONTACT_EMAIL && (
                <a href={`mailto:${CONTACT_EMAIL}`} className="hidden lg:flex hover:bg-red-800 p-1.5 rounded transition-colors" title={CONTACT_EMAIL}>
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Header (Logo + Search) ── */}
      <div className={`bg-white sticky top-0 z-40 transition-shadow duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="container mx-auto px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-3 sm:gap-4">

            {/* Logo — always navigates to home */}
            <a
              href={getLangPath('/')}
              className="flex min-w-0 flex-shrink-0 items-center gap-3 focus:outline-none"
              aria-label="Bullet Reporter — Home"
            >
              <img
                src="/logo.png"
                alt="Bullet Reporter"
                className="h-12 w-auto rounded-lg border-2 border-red-600 bg-white object-contain shadow-md sm:h-16 md:h-20"
              />
            </a>

            {/* Right: Search */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="search"
                    placeholder={t.header.searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-64 lg:w-80 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
                  />
                  {searchLoading ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </form>
                <SearchResults />
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop Navigation ── */}
      <div className="mb-0 hidden border-0 bg-red-600 outline-none md:block">
        <div className="container mx-auto px-4">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-3 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span className="text-white text-sm">{t.header.loadingCategories}</span>
            </div>
          ) : (
            <ul className="scrollbar-hide flex overflow-x-auto whitespace-nowrap">
              {mainCategories.map((category) => (
                <li key={category.name}>
                  <button
                    onClick={() => handleNavClick(category.href)}
                    className={`relative px-4 py-3 text-sm font-medium text-white transition-all group lg:px-5 ${
                      isActive(category.href)
                        ? 'bg-red-700 border-b-2 border-white'
                        : 'hover:bg-red-700'
                    }`}
                  >
                    {category.name}
                    {isActive(category.href) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMenuOpen && (
        <div className="absolute z-50 max-h-[calc(100vh-7.5rem)] w-full overflow-y-auto border-t border-red-100 bg-white shadow-2xl md:hidden">
          {/* Mobile Search */}
          <div className="relative px-4 pb-2 pt-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
              />
              {searchLoading ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              )}
            </form>
            <SearchResults />
          </div>

          {/* Mobile Nav Links */}
          <nav className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {mainCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleNavClick(category.href)}
                  className={`min-w-0 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive(category.href)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <span className="line-clamp-2">{category.name}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile Social */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <div className="flex items-center">
              <div className="flex gap-3">
                {socialLinks.map((s) => (
                  <a key={s.name} href={getShareHref(s.platform)}
                    target={s.platform === 'instagram' ? undefined : '_blank'}
                    rel={s.platform === 'instagram' ? undefined : 'noopener noreferrer'}
                    onClick={(event) => handleShareClick(event, s.platform)}
                    className="bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors" title={s.name}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close social dropdown */}
      {isSocialOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsSocialOpen(false)} />
      )}

      {/* Full-page overlay to close alert panel on mobile */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-[55] sm:hidden" onClick={() => setIsAlertOpen(false)} />
      )}

      {/* New-article popup toast */}
      {alertPopup && (
        <NewAlertPopup
          count={alertPopup.count}
          article={alertPopup.article}
          lang={lang}
          onDismiss={dismissPopup}
          onNavigate={goToArticle}
        />
      )}
    </header>
  )
}

export default Header
