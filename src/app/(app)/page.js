'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import NewsCard from '@/components/NewsCard'
import AdBanner from '@/components/AdBanner'
import LoadingSpinner from '@/components/LoadingSpinner'
import VideoNewsSection from '@/components/VideoNewsSection'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { getReadingTime } from '@/utils/timeUtils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Star, Zap, ChevronRight } from 'lucide-react'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'

const fetchArticles = async ({ queryKey }) => {
  const [, options] = queryKey
  return fetchPayloadArticles(options)
}

// ── Image-first breaking news card ─────────────────────────────────────────
function BreakingCard({ article, onClick, loading = 'lazy' }) {
  if (!article) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <div className="aspect-[16/9] w-full overflow-hidden rounded-md bg-gray-100 shadow-sm ring-1 ring-gray-200">
        <NewsImage
          article={article}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading={loading}
        />
      </div>
      <h3 className="mt-3 text-base font-black leading-snug text-gray-900 transition-colors group-hover:text-red-600 line-clamp-2 md:text-lg">
        {article.title}
      </h3>
    </button>
  )
}

function NewsImage({ article, className, loading = 'lazy' }) {
  return article.image_url ? (
    <img
      src={article.image_url}
      alt={article.title}
      className={className}
      loading={loading}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <span className="text-lg font-black text-red-200">BR</span>
    </div>
  )
}

function LatestFeatureCard({ article, onClick, loading = 'lazy' }) {
  if (!article) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-[220px] w-full flex-col overflow-hidden border border-gray-200 bg-white text-left transition-colors hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <NewsImage
          article={article}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading={loading}
        />
      </div>
      <h3 className="px-3 py-3 text-base font-black leading-snug text-gray-900 transition-colors group-hover:text-red-600 line-clamp-4 md:text-lg">
        {article.title}
      </h3>
    </button>
  )
}

function LatestMoreBox({ articles, onArticleClick, onViewAll, title, viewAllLabel }) {
  if (!articles.length) return null
  return (
    <aside className="relative border-[10px] border-red-600 bg-gray-50 px-3 pb-4 pt-3">
      <div className="absolute -bottom-[10px] left-0 h-12 w-7 bg-red-600"></div>
      <div className="absolute -bottom-[10px] right-0 h-12 w-7 bg-red-600"></div>
      <h3 className="mb-3 text-base font-black text-gray-900">
        <span className="text-red-600">{title.split(' ')[0]}</span>{' '}
        {title.split(' ').slice(1).join(' ')}
      </h3>
      <div className="space-y-3">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={article.slug ? onArticleClick(article.slug) : undefined}
            className="group grid w-full grid-cols-[72px_1fr] items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <div className="h-14 overflow-hidden bg-gray-100">
              <NewsImage
                article={article}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h4 className="text-sm font-black leading-snug text-gray-900 transition-colors group-hover:text-red-600 line-clamp-2">
              {article.title}
            </h4>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="relative z-10 mx-auto mt-4 flex items-center gap-1 text-sm font-black text-red-600 transition-colors hover:text-red-700"
      >
        {viewAllLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </aside>
  )
}

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])
  const goToArticle = useCallback((slug) => () => router.push(getLangPath(`/news/${encodeURIComponent(slug)}`)), [lang, router, getLangPath])

  const { data: breakingData, isLoading: breakingLoading, error: breakingError, refetch: refetchBreaking } = useQuery({
    queryKey: ['articles', { isBreaking: true, limit: 20, page: 1, lang, summary: true }],
    queryFn: fetchArticles,
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useQuery({
    queryKey: ['articles', { limit: 10, page: 1, lang, summary: true }],
    queryFn: fetchArticles,
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['articles', { isFeatured: true, limit: 6, page: 1, lang, summary: true }],
    queryFn: fetchArticles,
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
    enabled: !breakingLoading && !articlesLoading,
  })

  const breakingNews = breakingData?.articles || []
  const articles = articlesData?.articles || []
  const featuredArticles = featuredData?.articles || []
  const breakingPreviewArticles = breakingNews.slice(0, 4)
  const latestFeatureArticles = articles.slice(0, 6)
  const latestMoreArticles = articles.slice(6, 9).length ? articles.slice(6, 9) : articles.slice(0, 3)

  useEffect(() => {
    if (breakingError) toast({ title: t.home.errorBreaking, description: t.home.serverTimeout, variant: 'destructive' })
  }, [breakingError]) // eslint-disable-line

  useEffect(() => {
    if (articlesError) toast({ title: t.home.errorNews, description: t.home.serverTimeout, variant: 'destructive' })
  }, [articlesError]) // eslint-disable-line

  const handleRetry = useCallback(() => { refetchBreaking(); refetchArticles() }, [refetchBreaking, refetchArticles])

  return (
    <Layout>
      {/* Top Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>

      <main className="container mx-auto px-3 py-5 sm:px-4 sm:py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-12">

            {/* ── Breaking News ── */}
            <section>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="h-1.5 bg-red-700"></div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
                      <Zap className="h-4 w-4 fill-white" />
                    </span>
                    <h2 className="min-w-0 text-lg font-black text-gray-950 md:text-xl">
                      {t.home.breakingNews}
                    </h2>
                    <span className="hidden items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600 sm:flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                      LIVE
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(getLangPath('/news/breaking'))}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700"
                  >
                    {t.home.viewAll}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-4 py-5">
                  {breakingLoading ? (
                    <LoadingSpinner message={t.home.loadingBreaking} size="lg" variant="skeleton" skeletonCount={4} skeletonMinWidth={180} />
                  ) : breakingError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-2 font-medium">{t.home.errorBreaking}</p>
                      <p className="text-gray-400 text-sm mb-4">{t.home.serverTimeout}</p>
                      <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t.home.retry}</button>
                    </div>
                  ) : breakingNews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      {breakingPreviewArticles.map((article, index) => (
                        <BreakingCard
                          key={article.id}
                          article={article}
                          loading={index < 4 ? 'eager' : 'lazy'}
                          onClick={article.slug ? goToArticle(article.slug) : undefined}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">{t.home.noBreaking}</div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Mid Ad ── */}
            <section><AdBanner size="medium" position="middle_banner" /></section>


            {/* ── Latest News ── */}
            <section className="bg-white">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-4 w-4 rounded-sm bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%)]"></span>
                  <h2 className="text-xl font-black text-gray-950 md:text-2xl">
                    {t.home.latestNews}
                  </h2>
                </div>
                <button
                  onClick={() => router.push(getLangPath('/news'))}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-900 transition-colors hover:border-red-300 hover:text-red-600"
                >
                  {t.home.viewAll}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {articlesLoading ? (
                <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" skeletonCount={6} skeletonMinWidth={180} />
              ) : articlesError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2 font-medium">{t.home.errorNews}</p>
                  <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t.home.retry}</button>
                </div>
              ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1.25fr]">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {latestFeatureArticles.map((article, index) => (
                      <LatestFeatureCard
                        key={article.id}
                        article={article}
                        loading={index < 3 ? 'eager' : 'lazy'}
                        onClick={article.slug ? goToArticle(article.slug) : undefined}
                      />
                    ))}
                  </div>

                  <LatestMoreBox
                    articles={latestMoreArticles}
                    onArticleClick={goToArticle}
                    onViewAll={() => router.push(getLangPath('/news'))}
                    title={t.home.latestNews}
                    viewAllLabel={t.home.more}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.home.noNews}</div>
              )}
            </section>

            {/* ── Featured Articles ── */}
            {featuredArticles.length > 0 && (
              <section>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-7 bg-red-600 rounded-full inline-block"></span>
                      <span className="w-1 h-5 bg-red-400 rounded-full inline-block"></span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {t.home.specialArticles}
                    </h2>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {t.home.featured}
                  </span>
                </div>

                {featuredLoading ? (
                  <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" skeletonCount={4} skeletonMinWidth={260} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredArticles.map((article, i) => (
                      <NewsCard key={article.id} id={article.id} title={article.title}
                        excerpt={(article.description || '').slice(0, 120)}
                        category={article.category} categorySlug={article.category_slug}
                        categories={article.categories} categorySlugs={article.category_slugs}
                        author={article.editor_name || article.author_name}
                        publishedAt={article.created_at} readTime={getReadingTime(article.contentText || article.description)}
                        views={article.views || 0} imageUrl={article.image_url}
                        imageLoading={i < 2 ? 'eager' : 'lazy'}
                        youtubeUrl={article.youtube_url} slug={article.slug} featured={i === 0} />
                    ))}
                  </div>
                )}
              </section>
            )}

            <VideoNewsSection />
          </div>

          {/* ── Sidebar ── */}
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
