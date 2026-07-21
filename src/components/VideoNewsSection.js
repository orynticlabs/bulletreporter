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
      className={`group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-slate-100">
            <Video className="h-10 w-10 text-red-300" />
          </div>
        )}
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-xl transition-all group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
      </div>

      <div className="p-4">
        <h3 className={`font-black leading-snug text-slate-950 transition-colors group-hover:text-red-600 line-clamp-2 ${
          featured ? 'text-lg md:text-xl' : 'text-base'
        }`}>
          {video.title}
        </h3>
        {featured && video.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
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
    <section ref={sectionRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
            <Video className="h-5 w-5" />
          </span>
          <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Watch now</p>
          <h2 className="text-xl font-black text-slate-950 md:text-2xl">
            {t.home.videoNews}
          </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(getLangPath('/video-news'))}
          className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-red-300 hover:text-red-600"
        >
          {t.home.viewAll}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 ${compact ? 'md:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
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
