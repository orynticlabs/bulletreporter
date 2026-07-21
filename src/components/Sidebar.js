'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Wind, Droplets, RefreshCw, TrendingUp, UserRound } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AdvertisementSlot from '@/components/AdvertisementSlot'
import { fetchPayloadArticles, getMediaUrl } from '@/utils/payloadArticles'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'

const DEFAULT_WEATHER_CITY = 'Bhopal'
const DEFAULT_WEATHER_COORDS = { lat: 23.2599, lon: 77.4126 }

const fetchDirectorMessage = async () => {
  const response = await fetch('/api/director-details?limit=1&depth=1&sort=-updatedAt', {
    cache: 'no-store',
    credentials: 'omit',
  })

  if (!response.ok) throw new Error('Unable to load director message')
  const data = await response.json()
  return data?.docs?.[0] || null
}

function DirectorMessageCard({ message, lang, className = '' }) {
  const name = message?.name?.trim()
  const about = message?.about?.trim()
  const image = message?.image
  const imageUrl = getMediaUrl(image, 'f_auto,q_auto:best,c_fill,g_face,w_600,h_600')

  if (!name || !about || !imageUrl) return null

  return (
    <article className={`${className} overflow-hidden rounded-xl border border-red-100 bg-white shadow-md`}>
      <div className="h-1.5 bg-red-600" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={imageUrl}
            alt={name}
            className="h-20 w-20 shrink-0 rounded-full border-4 border-red-50 object-cover shadow-sm sm:h-24 sm:w-24 lg:h-20 lg:w-20"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
              {lang === 'en' ? 'Director Details' : 'निदेशक विवरण'}
            </p>
            <h3 className="mt-1 break-words text-lg font-black leading-tight text-gray-950">
              {name}
            </h3>
          </div>
        </div>
        <div className="mt-4 flow-root rounded-lg bg-red-50/70 p-4 text-sm font-medium leading-6 text-gray-700">
          <span className="float-left mr-3 mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-red-100">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="whitespace-pre-line break-words">{about}</p>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Facebook Page Embed
// Uses the official Facebook JavaScript SDK + fb-page XFBML element.
// This is the supported approach — the raw plugins/page.php iframe alone is
// unreliable because Facebook's servers validate the origin domain.
// ─────────────────────────────────────────────────────────────────────────────
function FacebookEmbed() {
  const pageUrl = (process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL || '').trim()
  const containerRef = useRef(null)
  const [embedWidth, setEmbedWidth] = useState(320)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const updateWidth = (width) => {
      const nextWidth = Math.max(180, Math.min(500, Math.floor(width)))
      setEmbedWidth((current) => current === nextWidth ? current : nextWidth)
    }

    updateWidth(container.getBoundingClientRect().width)

    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateWidth(entry.contentRect.width)
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  if (!pageUrl) {
    return (
      <div className="mx-auto w-full max-w-[500px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md lg:max-w-none">
        <div className="flex min-w-0 items-center gap-2.5 bg-[#1877F2] px-4 py-3">
          <svg className="h-5 w-5 flex-shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="truncate text-sm font-bold leading-5 text-white">Bullet Reporter</span>
        </div>
        <div className="flex flex-col items-center gap-2 py-6 px-4 text-center bg-gray-50">
          <p className="text-xs text-gray-400">
            Set <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_FACEBOOK_PAGE_URL</code> to enable this embed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="mx-auto w-full min-w-0 max-w-[500px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md lg:max-w-none">
      {/* Header */}
      <div className="flex min-w-0 items-center gap-2.5 bg-[#1877F2] px-4 py-3">
        <svg className="h-5 w-5 flex-shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="min-w-0 truncate text-sm font-bold leading-5 tracking-wide text-white">Bullet Reporter</span>
        <span className="ml-auto shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Facebook</span>
      </div>

      <a
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3"
        aria-label="Open Bullet Reporter on Facebook"
      >
        <img
          src="/logo.png"
          alt=""
          className="h-12 w-12 shrink-0 rounded-full border border-blue-200 bg-white object-contain p-1"
        />
        <span className="min-w-0 truncate text-base font-bold leading-6 text-[#2851a3]">
          Bullet Reporter
        </span>
      </a>

      <div className="h-[500px] overflow-hidden bg-white">
        <iframe
          key={embedWidth}
          title="Facebook Page timeline"
          src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=${embedWidth}&height=588&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`}
          className="block w-full max-w-full -translate-y-[88px] border-0 bg-white transition-opacity duration-300"
          style={{ height: 588, width: '100%' }}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          scrolling="no"
        />
      </div>

      {/* SDK embed container — no overflow:hidden so the FB iframe header isn't clipped */}
      <div
        className="hidden"
        style={{ minHeight: 500, background: '#fff' }}
      >
        {/* Loading skeleton shown before SDK fires */}
        {false && (
          <div className="flex flex-col gap-3 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-32 bg-gray-100 rounded" />
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
          </div>
        )}

        {/* Official Facebook Page Plugin element — parsed by FB.XFBML */}
        <div
          className="fb-page"
          data-href={pageUrl}
          data-tabs="timeline"
          data-width="320"
          data-height="500"
          data-small-header="true"
          data-adapt-container-width="true"
          data-hide-cover="false"
          data-show-facepile="true"
        >
          {/* Fallback for very slow loads */}
          <blockquote cite={pageUrl} className="fb-xfbml-parse-ignore" style={{ display: 'none' }}>
            <a href={pageUrl}>Facebook Page</a>
          </blockquote>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Channel Embed
//
// Uses the YouTube "Uploads" playlist embed.
// Every channel has an auto-generated uploads playlist whose ID is the
// channel ID with the leading two characters "UC" replaced by "UU".
//
// Example:  Channel ID  UCxxxxxxxxxxxxxx
//           Playlist ID UUxxxxxxxxxxxxxx
//
// Embed URL: https://www.youtube.com/embed/videoseries?list=UUxxxxxxxxxxxxxx
// ─────────────────────────────────────────────────────────────────────────────
function LazySidebarBlock({ children, minHeight = 320 }) {
  const blockRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) return undefined

    const node = blockRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '500px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div ref={blockRef} style={{ minHeight }}>
      {isVisible ? children : null}
    </div>
  )
}

function YouTubeEmbed() {
  const rawId = (process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '').trim()

  // Accept both "UCxxxxxx" and bare "xxxxxx" (strip any UC/UU prefix first)
  const coreId     = rawId.replace(/^U[CU]/i, '')
  const playlistId = coreId ? `UU${coreId}` : ''

  const embedSrc = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}&modestbranding=1&rel=0&controls=1`
    : ''

  if (!rawId) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="flex items-center gap-2 px-4 py-3 bg-red-600">
          <svg className="w-5 h-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a2.997 2.997 0 0 0-2.108-2.108C19.625 3.5 12 3.5 12 3.5s-7.625 0-9.39.578A2.997 2.997 0 0 0 .502 6.186C0 7.94 0 12 0 12s0 4.06.502 5.814a2.997 2.997 0 0 0 2.108 2.108C4.375 20.5 12 20.5 12 20.5s7.625 0 9.39-.578a2.997 2.997 0 0 0 2.108-2.108C24 16.06 24 12 24 12s0-4.06-.502-5.814zM9.75 15.75V8.25l6.5 3.75-6.5 3.75z" />
          </svg>
          <span className="font-bold text-white text-sm">YouTube</span>
        </div>
        <div className="flex flex-col items-center gap-2 py-6 px-4 text-center bg-gray-50">
          <p className="text-xs text-gray-400">
            Set <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_YOUTUBE_CHANNEL_ID</code> (UCxxxxxx format) to enable this embed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-red-600">
        <svg className="w-5 h-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a2.997 2.997 0 0 0-2.108-2.108C19.625 3.5 12 3.5 12 3.5s-7.625 0-9.39.578A2.997 2.997 0 0 0 .502 6.186C0 7.94 0 12 0 12s0 4.06.502 5.814a2.997 2.997 0 0 0 2.108 2.108C4.375 20.5 12 20.5 12 20.5s7.625 0 9.39-.578a2.997 2.997 0 0 0 2.108-2.108C24 16.06 24 12 24 12s0-4.06-.502-5.814zM9.75 15.75V8.25l6.5 3.75-6.5 3.75z" />
        </svg>
        <span className="font-bold text-white text-sm tracking-wide">YouTube</span>
      </div>

      {/* 16:9 responsive iframe */}
      <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
        <iframe
          src={embedSrc}
          title="YouTube Channel"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Sidebar
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar() {
  const router = useRouter()
  const { t, lang } = useLanguage()

  const { data: directorMessage = null } = useQuery({
    queryKey: ['director-details'],
    queryFn: fetchDirectorMessage,
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  // ── Weather ─────────────────────────────────────────────────────────────
  const [weatherData, setWeatherData] = useState({
    temperature: null, humidity: null, windSpeed: null,
    description: '', city: DEFAULT_WEATHER_CITY, loading: true, error: null, lastUpdated: null, source: 'default',
  })
  const weatherCoordsRef = useRef({ ...DEFAULT_WEATHER_COORDS, source: 'default' })

  const getBrowserPosition = useCallback(() => new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      }),
      reject,
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 10 * 60 * 1000,
      },
    )
  }), [])

  const fetchWeatherByCoords = useCallback(async ({ lat, lon, source }) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    if (!apiKey) throw new Error('Missing weather API key')

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${lang === 'en' ? 'en' : 'hi'}`,
      { next: { revalidate: 600 } },
    )
    if (!res.ok) throw new Error('Weather API error')

    const data = await res.json()

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      description: data.weather[0]?.description || '',
      city: data.name || (source === 'current' ? (lang === 'en' ? 'Current location' : 'वर्तमान स्थान') : DEFAULT_WEATHER_CITY),
      loading: false,
      error: null,
      source,
      lastUpdated: new Date().toLocaleTimeString(
        lang === 'en' ? 'en-IN' : 'hi-IN',
        { hour: '2-digit', minute: '2-digit' },
      ),
    }
  }, [lang])

  const fetchWeatherData = useCallback(async ({ requestLocation = true } = {}) => {
    try {
      setWeatherData(prev => ({ ...prev, loading: true, error: null }))

      let coords = {
        lat: weatherCoordsRef.current.lat,
        lon: weatherCoordsRef.current.lon,
      }
      let source = weatherCoordsRef.current.source || 'default'

      if (requestLocation) {
        try {
          coords = await getBrowserPosition()
          source = 'current'
        } catch {
          coords = DEFAULT_WEATHER_COORDS
          source = 'default'
        }
      }

      weatherCoordsRef.current = { ...coords, source }
      const nextWeather = await fetchWeatherByCoords({ ...coords, source })
      setWeatherData(nextWeather)
    } catch {
      setWeatherData(prev => ({ ...prev, loading: false, error: t.sidebar.weatherError }))
    }
  }, [fetchWeatherByCoords, getBrowserPosition, t.sidebar.weatherError])

  useEffect(() => {
    fetchWeatherData({ requestLocation: true })
    const id = setInterval(() => fetchWeatherData({ requestLocation: false }), 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchWeatherData])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return undefined

    let permissionStatus
    let cancelled = false

    navigator.permissions.query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled) return
        permissionStatus = status
        if (status.state === 'granted') {
          fetchWeatherData({ requestLocation: true })
        }
        status.onchange = () => {
          if (status.state === 'granted') {
            fetchWeatherData({ requestLocation: true })
          }
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (permissionStatus) permissionStatus.onchange = null
    }
  }, [fetchWeatherData])

  // ── Trending news ────────────────────────────────────────────────────────
  const { data: trendingData = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending', lang],
    queryFn: async () => {
      const result = await fetchPayloadArticles({ limit: 10, lang, summary: true })
      return result.articles || []
    },
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])

  return (
    <div className="flex flex-col gap-5">

      <DirectorMessageCard
        message={directorMessage}
        lang={lang}
        className="order-last lg:order-first"
      />

      {/* 1. Weather ──────────────────────────────────────────────────────── */}
      <div className="min-h-[210px] bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            {t.sidebar.weather}
          </h3>
          <button
            onClick={() => fetchWeatherData({ requestLocation: true })}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
            title={t.sidebar.refreshWeather}
          >
            <RefreshCw className={`w-4 h-4 ${weatherData.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {weatherData.loading ? (
          <div className="animate-pulse space-y-3 pt-2">
            <div className="h-10 bg-white/30 rounded w-28" />
            <div className="h-4 bg-white/25 rounded w-36" />
            <div className="h-4 bg-white/20 rounded w-24" />
            <div className="flex gap-3 pt-2">
              <div className="h-6 bg-white/20 rounded w-24" />
              <div className="h-6 bg-white/20 rounded w-20" />
            </div>
          </div>
        ) : weatherData.error ? (
          <div className="text-center">
            <p className="text-sm text-white/80 mb-2">{weatherData.error}</p>
            <button
              onClick={() => fetchWeatherData({ requestLocation: true })}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
            >
              {t.sidebar.retryWeather}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-bold">{weatherData.temperature}°C</span>
            </div>
            <p className="text-white/90 text-sm capitalize mb-1">{weatherData.description}</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-white/75 text-xs">{weatherData.city}</p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/85">
                {weatherData.source === 'current'
                  ? (lang === 'en' ? 'Current location' : 'वर्तमान स्थान')
                  : (lang === 'en' ? 'Default: Bhopal' : 'डिफॉल्ट: भोपाल')}
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Droplets className="w-4 h-4 text-blue-200" />
                <span>{t.sidebar.humidity}: {weatherData.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-4 h-4 text-blue-200" />
                <span>{weatherData.windSpeed} km/h</span>
              </div>
            </div>
            {weatherData.lastUpdated && (
              <p className="text-white/60 text-xs mt-2">
                {t.sidebar.updatedAt}: {weatherData.lastUpdated}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Trending News ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <h3 className="font-bold text-lg text-primary mb-3 flex items-center gap-2 border-b pb-2">
          <TrendingUp className="w-5 h-5 text-red-500 flex-shrink-0" />
          {t.sidebar.topTrending}
        </h3>

        {trendingLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-2.5 rounded-lg p-1.5">
                <div className="w-14 h-14 bg-gray-200 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">{t.sidebar.noTrending}</p>
        ) : (
          <div className="space-y-1.5">
            {trendingData.map((news, index) => (
              <div
                key={news.id}
                className="flex gap-2.5 cursor-pointer hover:bg-red-50 p-1.5 rounded-lg transition-colors group"
                onClick={() => router.push(getLangPath(`/news/${encodeURIComponent(news.slug)}`))}
              >
                <div className="relative w-14 h-14 flex-shrink-0">
                  {news.image_url ? (
                    <img
                      src={news.image_url}
                      alt={news.title}
                      className="w-14 h-14 object-cover rounded-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-md flex items-center justify-center">
                      <span className="text-red-600 font-bold text-base">{index + 1}</span>
                    </div>
                  )}
                  <div className="absolute -top-1 -left-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {index + 1}
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-gray-700 line-clamp-3 leading-snug group-hover:text-red-600 transition-colors">
                  {news.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Facebook Page embed ──────────────────────────────────────────── */}
      <LazySidebarBlock minHeight={560}>
        <FacebookEmbed />
      </LazySidebarBlock>

      {/* 4. YouTube Channel embed ────────────────────────────────────────── */}
      <LazySidebarBlock minHeight={260}>
        <YouTubeEmbed />
      </LazySidebarBlock>

      <AdvertisementSlot position="sidebar" />

    </div>
  )
}

export default Sidebar
