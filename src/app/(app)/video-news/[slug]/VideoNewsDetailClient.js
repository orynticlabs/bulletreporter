'use client'

import { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Clock, Play, User, Video } from 'lucide-react'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchPayloadVideoNewsBySlug, normalizeRouteSlug } from '@/utils/payloadArticles'
import { getRelativeTime } from '@/utils/dateUtils'
import { getReadingTime } from '@/utils/timeUtils'
import { CONTENT_STALE_TIME } from '@/utils/queryConfig'

export default function VideoNewsDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { t, lang } = useLanguage()
  const slug = normalizeRouteSlug(params?.slug || '')
  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])

  const { data: video, isLoading } = useQuery({
    queryKey: ['video-news-detail', slug, lang],
    queryFn: () => fetchPayloadVideoNewsBySlug(slug, { lang }),
    enabled: Boolean(slug),
    staleTime: CONTENT_STALE_TIME,
    retry: 1,
  })

  return (
    <Layout>
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <article className="lg:col-span-3">
            {isLoading ? (
              <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" />
            ) : !video ? (
              <div className="rounded-lg border border-gray-100 bg-white p-6 text-center sm:p-12">
                <h1 className="mb-2 text-xl font-black text-gray-950 sm:text-2xl">
                  {t.newsDetail.articleNotFound}
                </h1>
                <p className="mb-5 text-gray-500">{t.newsDetail.articleNotFoundDesc}</p>
                <button
                  type="button"
                  onClick={() => router.push(getLangPath('/video-news'))}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  {t.newsDetail.goHome}
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="relative aspect-video bg-gray-950">
                  {video.youtube_embed_url ? (
                    <iframe
                      src={`${video.youtube_embed_url}?rel=0&modestbranding=1`}
                      title={video.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-950 to-gray-950 text-white">
                      <Play className="h-12 w-12 fill-white" />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 md:p-7">
                  <button
                    type="button"
                    onClick={() => router.push(getLangPath('/video-news'))}
                    className="mb-5 flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t.news.goBack}
                  </button>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                      <Video className="h-3.5 w-3.5" />
                      {t.home.videoNews}
                    </span>
                    {video.category && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                        {video.category}
                      </span>
                    )}
                  </div>

                  <h1 className="mb-4 break-words text-2xl font-black leading-tight text-gray-950 md:text-4xl">
                    {video.title}
                  </h1>

                  <div className="mb-6 flex flex-wrap gap-3 border-b border-gray-100 pb-4 text-xs text-gray-500 md:text-sm">
                    {(video.editor_name || video.author_name) && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-red-500" />
                        {video.editor_name || video.author_name}
                      </span>
                    )}
                    {video.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-red-500" />
                        {getRelativeTime(video.created_at)}
                      </span>
                    )}
                    {(video.contentText || video.description) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-red-500" />
                        {getReadingTime(video.contentText || video.description)} {t.newsCard.min}
                      </span>
                    )}
                  </div>

                  {video.description && (
                    <p className="mb-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-base font-semibold leading-relaxed text-gray-800">
                      {video.description}
                    </p>
                  )}

                  <div
                    className="prose prose-sm max-w-none text-gray-700 md:prose-base"
                    dangerouslySetInnerHTML={{ __html: video.content || '' }}
                  />
                </div>
              </div>
            )}
          </article>

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
