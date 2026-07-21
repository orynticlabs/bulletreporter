'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import NewsCard from '@/components/NewsCard'
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
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <NewsImage
          article={article}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading={loading}
        />
      </div>
      <h3 className="min-h-[68px] px-3.5 py-3 text-[15px] font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-red-600 line-clamp-3">
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
      className="group flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <NewsImage
          article={article}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading={loading}
        />
      </div>
      <h3 className="px-4 py-4 text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-red-600 line-clamp-3">
        {article.title}
      </h3>
    </button>
  )
}

function LatestMoreBox({ articles, onArticleClick, onViewAll, title, viewAllLabel }) {
  if (!articles.length) return null
  return (
    <aside className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 pb-5 pt-4 text-slate-950 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
      <h3 className="mb-4 border-b border-slate-200 pb-3 text-base font-black">
        <span className="text-red-600">{title.split(' ')[0]}</span>{' '}
        {title.split(' ').slice(1).join(' ')}
      </h3>
      <div className="divide-y divide-slate-100">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={article.slug ? onArticleClick(article.slug) : undefined}
            className="group grid w-full grid-cols-[82px_1fr] items-center gap-3 py-3 text-left focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <div className="h-16 overflow-hidden rounded-lg bg-slate-100">
              <NewsImage
                article={article}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h4 className="text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-red-600 line-clamp-3">
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
    queryKey: ['articles', { isBreaking: true, limit: 40, page: 1, lang, summary: true }],
    queryFn: fetchArticles,
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useQuery({
    queryKey: ['articles', { limit: 18, page: 1, lang, summary: true }],
    queryFn: fetchArticles,
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['articles', { isFeatured: true, limit: 9, page: 1, lang, summary: true }],
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
  const breakingPreviewArticles = breakingNews.slice(0, 40)
  const latestFeatureArticles = articles.slice(0, 12)
  const latestMoreArticles = articles.slice(12, 18).length ? articles.slice(12, 18) : articles.slice(0, 6)

  useEffect(() => {
    if (breakingError) toast({ title: t.home.errorBreaking, description: t.home.serverTimeout, variant: 'destructive' })
  }, [breakingError]) // eslint-disable-line

  useEffect(() => {
    if (articlesError) toast({ title: t.home.errorNews, description: t.home.serverTimeout, variant: 'destructive' })
  }, [articlesError]) // eslint-disable-line

  const handleRetry = useCallback(() => { refetchBreaking(); refetchArticles() }, [refetchBreaking, refetchArticles])

  return (
    <Layout>
      <main className="container mx-auto px-3 py-5 sm:px-4 sm:py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="space-y-14 lg:col-span-3">

            {/* ── Breaking News ── */}
            <section>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 text-slate-950">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm">
                      <Zap className="h-4 w-4 fill-white" />
                    </span>
                    <h2 className="min-w-0 text-xl font-black md:text-2xl">
                      {t.home.breakingNews}
                    </h2>
                    <span className="hidden items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600 ring-1 ring-red-100 sm:flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                      LIVE
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(getLangPath('/news/breaking'))}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    {t.home.viewAll}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 sm:p-5">
                  {breakingLoading ? (
                    <LoadingSpinner message={t.home.loadingBreaking} size="lg" variant="skeleton" skeletonCount={4} skeletonMinWidth={180} />
                  ) : breakingError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-2 font-medium">{t.home.errorBreaking}</p>
                      <p className="text-gray-400 text-sm mb-4">{t.home.serverTimeout}</p>
                      <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t.home.retry}</button>
                    </div>
                  ) : breakingNews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

            {/* ── Latest News ── */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-5">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-8 w-1.5 rounded-full bg-red-600" />
                  <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Latest updates</p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {t.home.latestNews}
                  </h2>
                  </div>
                </div>
                <button
                  onClick={() => router.push(getLangPath('/news'))}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-red-300 hover:text-red-600"
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
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2.2fr_1fr]">
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
              <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-red-50 p-4 ring-1 ring-amber-200/70 shadow-sm sm:p-5">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/70 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-sm">
                      <Star className="h-5 w-5 fill-slate-950" />
                    </div>
                    <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                      {t.home.specialArticles}
                    </h2>
                  </div>
                  <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {t.home.featured}
                  </span>
                </div>

                {featuredLoading ? (
                  <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" skeletonCount={4} skeletonMinWidth={260} />
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

            <VideoNewsSection limit={9} />
          </div>

          {/* ── Sidebar ── */}
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
