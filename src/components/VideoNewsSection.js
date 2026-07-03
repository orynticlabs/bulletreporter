'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Play, Video } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchPayloadVideoNews } from '@/utils/payloadArticles'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'

function VideoNewsCard({ video, featured = false, onOpen }) {
  if (!video) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-gray-950">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-950 to-gray-950">
            <Video className="h-10 w-10 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
          Video News
        </span>
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-lg transition-transform group-hover:scale-110">
          <Play className="ml-0.5 h-5 w-5 fill-red-600" />
        </span>
      </div>

      <div className="p-4">
        {video.category && (
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-red-600">
            {video.category}
          </p>
        )}
        <h3 className={`font-black leading-snug text-gray-950 transition-colors group-hover:text-red-600 line-clamp-2 ${
          featured ? 'text-lg md:text-xl' : 'text-base'
        }`}>
          {video.title}
        </h3>
        {featured && video.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {video.description}
          </p>
        )}
      </div>
    </button>
  )
}

export default function VideoNewsSection({ limit = 5, compact = false, initialVideos }) {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])
  const hasInitialVideos = Array.isArray(initialVideos)
  const sectionRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(hasInitialVideos)

  useEffect(() => {
    if (shouldLoad) return undefined

    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '500px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldLoad])

  const { data, isLoading } = useQuery({
    queryKey: ['video-news', { limit, page: 1, lang }],
    queryFn: () => fetchPayloadVideoNews({ limit, page: 1, lang }),
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
    enabled: !hasInitialVideos && shouldLoad,
  })

  const videos = hasInitialVideos ? initialVideos : (data?.videos || [])
  const loading = !shouldLoad || (hasInitialVideos ? false : isLoading)

  if (shouldLoad && !loading && videos.length === 0) return null

  return (
    <section ref={sectionRef} className="rounded-lg border border-red-100 bg-white shadow-sm">
      <div className="h-1.5 bg-red-700" />
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
            <Video className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-black text-gray-950 md:text-xl">
            {t.home.videoNews}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => router.push(getLangPath('/video-news'))}
          className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700"
        >
          {t.home.viewAll}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
            {videos.map((video, index) => (
              <VideoNewsCard
                key={video.id}
                video={video}
                featured={!compact && index === 0}
                onOpen={() => router.push(getLangPath(`/video-news/${encodeURIComponent(video.slug)}`))}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
