'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import NewsCard from '@/components/NewsCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getReadingTime } from '@/utils/timeUtils'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { useLanguage } from '@/contexts/LanguageContext'
import { Zap, ChevronLeft, Loader2 } from 'lucide-react'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'
import Sidebar from '@/components/Sidebar'

const LIMIT = 12

export default function BreakingNewsPage() {
  const router = useRouter()
  const loadMoreRef = useRef(null)
  const { t, lang } = useLanguage()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['breaking-news-page', lang],
    queryFn: ({ pageParam = 1 }) => fetchPayloadArticles({ isBreaking: true, limit: LIMIT, page: pageParam, lang, summary: true }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.page || 1
      return currentPage < (lastPage?.totalPages || 1) ? currentPage + 1 : undefined
    },
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const articles = useMemo(() => data?.pages.flatMap((page) => page.articles || []) || [], [data])

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || typeof IntersectionObserver === 'undefined' || !hasNextPage) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '700px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <Layout>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Zap className="w-7 h-7 text-red-500" />
            {t.home.breakingNews}
          </h1>
          <button onClick={() => router.push(getLangPath('/'))}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <ChevronLeft className="w-4 h-4" /> {t.news.goBack}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Articles */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <LoadingSpinner message={t.home.loadingBreaking} size="lg" variant="skeleton" skeletonCount={9} skeletonMinWidth={220} />
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 mb-4">{t.news.errorLoading}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  {t.news.retry}
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">{t.home.noBreaking}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((article, i) => (
                    <NewsCard key={article.id} id={article.id} title={article.title}
                      excerpt={(article.description || '').slice(0, 100) + '...'}
                      category={article.category} categorySlug={article.category_slug}
                      categories={article.categories} categorySlugs={article.category_slugs}
                      author={article.editor_name || article.author_name}
                      publishedAt={article.created_at}
                      readTime={getReadingTime(article.contentText || article.description)}
                      views={article.views || 0} imageUrl={article.image_url}
                      imageLoading={i < 6 ? 'eager' : 'lazy'}
                      youtubeUrl={article.youtube_url} slug={article.slug} featured={i === 0} />
                  ))}
                </div>
                <div ref={loadMoreRef} className="mt-10 flex min-h-10 items-center justify-center">
                  {isFetchingNextPage && (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      {t.home.loadingBreaking}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </aside>
        </div>
      </main>
    </Layout>
  )
}
