'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import NewsCard from '@/components/NewsCard'
import Sidebar from '@/components/Sidebar'
import LoadingSpinner from '@/components/LoadingSpinner'
import AdBanner from '@/components/AdBanner'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getReadingTime } from '@/utils/timeUtils'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'

const LIMIT = 12

export default function AllNews() {
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
    queryKey: ['all-news', lang],
    queryFn: ({ pageParam = 1 }) => fetchPayloadArticles({ limit: LIMIT, page: pageParam, lang, summary: true }),
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
  const total = data?.pages?.[0]?.total || 0

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
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>

      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">{t.news.allNews}</h1>
            {total > 0 && (
              <p className="text-gray-500 mt-1">{total} {t.news.newsFound}</p>
            )}
          </div>
          <button
            onClick={() => router.push(getLangPath('/'))}
            className="flex shrink-0 items-center gap-2 font-medium text-red-600 hover:text-red-700"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.news.goBack}
          </button>
        </div>

        {/* Main 3-col + sidebar layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Articles area */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <LoadingSpinner message={t.news.loadingNews} size="lg" variant="skeleton" skeletonCount={9} skeletonMinWidth={220} />
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 text-lg mb-4">{t.news.errorLoading}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t.news.retry}
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">{t.news.noNewsAvailable}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((article, index) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      excerpt={(article.description || '').slice(0, 100) + '...'}
                      category={article.category}
                      categorySlug={article.category_slug}
                      categories={article.categories}
                      categorySlugs={article.category_slugs}
                      author={article.editor_name || article.author_name}
                      publishedAt={article.created_at}
                      readTime={getReadingTime(article.contentText || article.description)}
                      views={article.views || 0}
                      imageUrl={article.image_url}
                      imageLoading={index < 6 ? 'eager' : 'lazy'}
                      youtubeUrl={article.youtube_url}
                      slug={article.slug}
                    />
                  ))}
                </div>

                <div ref={loadMoreRef} className="mt-10 flex min-h-10 items-center justify-center">
                  {isFetchingNextPage && (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      {t.news.loadingNews}
                    </span>
                  )}
                </div>
              </>
            )}

            <div className="mt-8">
              <AdBanner size="large" position="bottom_banner" />
            </div>
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
