'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import NewsCard from '@/components/NewsCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getReadingTime } from '@/utils/timeUtils'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { fetchPayloadCategories, getCategoryDisplayName, getCategoryRouteKey } from '@/utils/payloadCategories'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'
import Sidebar from '@/components/Sidebar'

const LIMIT = 12

export default function CategoryNews() {
  const params = useParams()
  const router = useRouter()
  const category = decodeURIComponent(params.category || '')
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
    queryKey: ['category-news', category, lang],
    queryFn: ({ pageParam = 1 }) => fetchPayloadArticles({ category, limit: LIMIT, page: pageParam, lang, summary: true }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.page || 1
      return currentPage < (lastPage?.totalPages || 1) ? currentPage + 1 : undefined
    },
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
    enabled: !!category,
  })

  const articles = useMemo(() => data?.pages.flatMap((page) => page.articles || []) || [], [data])
  const total = data?.pages?.[0]?.total || 0
  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'category-page'],
    queryFn: () => fetchPayloadCategories({ limit: 100 }),
    staleTime: CONTENT_STALE_TIME,
  })

  const currentCategory = useMemo(() => {
    const decodedCategory = category.trim().toLowerCase()

    return categories.find((item) => {
      const values = [
        getCategoryRouteKey(item),
        item.slug,
        item.name,
        item.nameHindi,
        item.nameEn,
      ]

      return values
        .filter(Boolean)
        .some((value) => String(value).trim().toLowerCase() === decodedCategory)
    })
  }, [categories, category])

  const categoryTitle = currentCategory
    ? getCategoryDisplayName(currentCategory, lang)
    : category

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
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 mb-1">{t.news.category}</p>
            <h1 className="break-words text-2xl font-bold text-primary sm:text-4xl">{categoryTitle}</h1>
            {total > 0 && <p className="text-gray-500 mt-1">{total} {t.news.newsFound}</p>}
          </div>
          <button onClick={() => router.push(getLangPath('/'))}
            className="flex shrink-0 items-center gap-2 font-medium text-red-600 hover:text-red-700">
            <ChevronLeft className="w-4 h-4" /> {t.news.goBack}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Articles */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <LoadingSpinner message={t.news.loadingNews} size="lg" variant="skeleton" skeletonCount={9} skeletonMinWidth={220} />
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 mb-4">{t.news.errorLoading}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  {t.news.retry}
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">{categoryTitle} — {t.news.noNewsFound}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((article, index) => (
                    <NewsCard key={article.id} id={article.id} title={article.title}
                      excerpt={(article.description || '').slice(0, 100) + '...'}
                      category={article.category} categorySlug={article.category_slug}
                      categories={article.categories} categorySlugs={article.category_slugs}
                      author={article.editor_name || article.author_name}
                      publishedAt={article.created_at}
                      readTime={getReadingTime(article.contentText || article.description)}
                      views={article.views || 0} imageUrl={article.image_url}
                      imageLoading={index < 6 ? 'eager' : 'lazy'}
                      youtubeUrl={article.youtube_url} slug={article.slug} />
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
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Sidebar />
            </div>
          </aside>
        </div>
      </main>
    </Layout>
  )
}
