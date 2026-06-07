'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Play, Video } from 'lucide-react'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchPayloadVideoNews } from '@/utils/payloadArticles'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'
import { useToast } from '@/hooks/use-toast'

const LIMIT = 12

function VideoCard({ video, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
        <h2 className="line-clamp-2 text-base font-black leading-snug text-gray-950 transition-colors group-hover:text-red-600">
          {video.title}
        </h2>
        {video.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {video.description}
          </p>
        )}
      </div>
    </button>
  )
}

export default function VideoNewsListClient() {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])

  // Track the top video ID from the previous fetch so we can detect
  // when a background refetch brings in content that wasn't there before.
  const prevTopIdRef = useRef(null)

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['video-news-list', { limit: LIMIT, page, lang }],
    queryFn: () => fetchPayloadVideoNews({ limit: LIMIT, page, lang }),
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  // Fire a toast whenever a background refetch returns a new top video.
  // We skip the very first load (prevTopIdRef is null) so the toast only
  // appears on subsequent refreshes, not on initial page mount.
  useEffect(() => {
    const videos = data?.videos
    if (!videos?.length) return

    const topId = videos[0].id

    if (prevTopIdRef.current !== null && prevTopIdRef.current !== topId) {
      toast({
        title: '🎬 नया वीडियो न्यूज़ उपलब्ध है',
        description: videos[0].title || 'नई वीडियो सामग्री जोड़ी गई है।',
        duration: 5000,
      })
    }

    prevTopIdRef.current = topId
  }, [dataUpdatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const videos = data?.videos || []
  const totalPages = data?.totalPages || 1

  return (
    <Layout>
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                  <Video className="h-5 w-5" />
                </span>
                <h1 className="min-w-0 text-2xl font-black text-gray-950 md:text-3xl">
                  {t.home.videoNews}
                </h1>
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" />
            ) : error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 p-8 text-center text-red-600">
                {t.news.errorLoading}
              </div>
            ) : videos.length === 0 ? (
              <div className="rounded-lg border border-gray-100 bg-white p-12 text-center text-gray-500">
                {t.news.noNewsAvailable}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onOpen={() => router.push(getLangPath(`/video-news/${encodeURIComponent(video.slug)}`))}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      disabled={page <= 1}
                      className="flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:border-red-300 hover:text-red-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.news.previous}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:border-red-300 hover:text-red-600"
                    >
                      {t.news.next}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:col-span-1 lg:block">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}