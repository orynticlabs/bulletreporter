'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Facebook, Instagram, X, Youtube } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const LEGACY_STORAGE_KEY = 'bulletreporter:social-follow-popup-dismissed'
const SESSION_STORAGE_KEY = 'bulletreporter:social-follow-popup-closed-at'
const FIRST_OPEN_DELAY_MS = 900
const REPEAT_DELAY_MS = 20 * 60 * 1000
const ACTIVE_RECHECK_DELAY_MS = 60 * 1000

const getExternalUrl = (value = '') => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed.replace(/^\/+/, '')}`
}

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    label: 'Instagram',
    url: getExternalUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL || ''),
    icon: Instagram,
    className: 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    url: getExternalUrl(process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL || ''),
    icon: Facebook,
    className: 'bg-[#1877F2] text-white',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    url: getExternalUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL || ''),
    icon: Youtube,
    className: 'bg-[#FF0000] text-white',
  },
]

const COPY = {
  hi: {
    eyebrow: 'Bullet Reporter',
    title: 'हमसे सोशल मीडिया पर जुड़ें',
    description: 'लेटेस्ट खबरों और वीडियो अपडेट्स के लिए हमें फॉलो करें और YouTube चैनल सब्सक्राइब करें।',
    close: 'Close popup',
    maybeLater: 'बाद में',
  },
  en: {
    eyebrow: 'Bullet Reporter',
    title: 'Follow Us For Updates',
    description: 'Get the latest news and video updates by following us and subscribing to our YouTube channel.',
    close: 'Close popup',
    maybeLater: 'Maybe later',
  },
}

export default function SocialFollowPopup() {
  const { lang } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [closedAt, setClosedAt] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const availableLinks = useMemo(() => SOCIAL_LINKS.filter((link) => link.url), [])
  const copy = COPY[lang] || COPY.hi

  useEffect(() => {
    if (!availableLinks.length) return

    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
      const storedClosedAt = Number(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || 0)
      if (storedClosedAt > 0) setClosedAt(storedClosedAt)
    } catch (_) {
      // Storage can fail in strict browser modes; the popup still works for this page view.
    }
  }, [availableLinks.length])

  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now()
    }

    window.addEventListener('click', markActive, { passive: true })
    window.addEventListener('keydown', markActive)
    window.addEventListener('scroll', markActive, { passive: true })
    window.addEventListener('touchstart', markActive, { passive: true })

    return () => {
      window.removeEventListener('click', markActive)
      window.removeEventListener('keydown', markActive)
      window.removeEventListener('scroll', markActive)
      window.removeEventListener('touchstart', markActive)
    }
  }, [])

  useEffect(() => {
    if (!availableLinks.length || isVisible) return

    const now = Date.now()
    const delay = closedAt > 0 ? Math.max(REPEAT_DELAY_MS - (now - closedAt), 0) : FIRST_OPEN_DELAY_MS

    const timer = window.setTimeout(() => {
      const isUserActive = Date.now() - lastActivityRef.current <= REPEAT_DELAY_MS
      if (document.visibilityState === 'visible' && isUserActive) {
        setIsVisible(true)
      } else {
        setClosedAt(Date.now() - REPEAT_DELAY_MS + ACTIVE_RECHECK_DELAY_MS)
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [availableLinks.length, closedAt, isVisible])

  const closePopup = () => {
    const nextClosedAt = Date.now()

    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, String(nextClosedAt))
    } catch (_) {
      // Ignore storage failures; closing should still work for this page view.
    }

    setClosedAt(nextClosedAt)
    setIsVisible(false)
  }

  if (!isVisible || !availableLinks.length) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 px-4 py-5 backdrop-blur-[2px] sm:items-center">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-follow-title"
      >
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
          aria-label={copy.close}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-red-600 px-6 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-100">{copy.eyebrow}</p>
          <h2 id="social-follow-title" className="mt-2 pr-10 text-2xl font-extrabold leading-tight">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-50">{copy.description}</p>
        </div>

        <div className="space-y-3 px-5 py-5">
          {availableLinks.map(({ key, label, url, icon: Icon, className }) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${className}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold">{label}</span>
              </span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          ))}

          <button
            type="button"
            onClick={closePopup}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            {copy.maybeLater}
          </button>
        </div>
      </div>
    </div>
  )
}
