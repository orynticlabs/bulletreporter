'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import NewsCard from '@/components/NewsCard'
import AdBanner from '@/components/AdBanner'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shareOnPlatform } from '@/utils/socialSharing'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { getReadingTime } from '@/utils/timeUtils'
import { getRelativeTime } from '@/utils/dateUtils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Star, Zap, ChevronRight, Clock, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const fetchArticles = async ({ queryKey }) => {
  const [, options] = queryKey
  return fetchPayloadArticles(options)
}

// ── Hero card (first breaking article) ──────────────────────────────────────
function HeroCard({ article, onClick }) {
  const { lang } = useLanguage()
  if (!article) return null
  return (
    <div
      onClick={onClick}
      className="cursor-pointer group mb-5"
    >
      {/* Title above image — newspaper style */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug mb-3">
        {article.title}
      </h2>

      {/* Image — full width, 16:9, no crop */}
      {article.image_url && (
        <div className="w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16/9' }}>
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            loading="eager"
          />
        </div>
      )}

      {/* Meta + excerpt below image */}
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {article.category && (
            <Badge className="bg-red-600 text-white text-xs px-2 py-0.5">{article.category}</Badge>
          )}
          {article.created_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-400" />
              {getRelativeTime(article.created_at)}
            </span>
          )}
          {article.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-red-400" />
              {article.views.toLocaleString()}
            </span>
          )}
        </div>
        {article.description && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {article.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Horizontal mini-card ────────────────────────────────────────────────────
function MiniCard({ article, onClick }) {
  if (!article) return null
  return (
    <div
      onClick={onClick}
      className="flex gap-3 cursor-pointer group hover:bg-red-50 rounded-xl p-2 transition-colors"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <span className="text-red-400 font-bold text-lg opacity-40">BR</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 py-0.5">
        {article.category && (
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
            {article.category}
          </span>
        )}
        <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-3 leading-snug mt-0.5">
          {article.title}
        </p>
        {article.created_at && (
          <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {getRelativeTime(article.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])
  const goToArticle = useCallback((slug) => () => router.push(getLangPath(`/news/${encodeURIComponent(slug)}`)), [lang, router, getLangPath])

  const { data: breakingData, isLoading: breakingLoading, error: breakingError, refetch: refetchBreaking } = useQuery({
    queryKey: ['articles', { isBreaking: true, limit: 7, page: 1 }],
    queryFn: fetchArticles,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useQuery({
    queryKey: ['articles', { limit: 10, page: 1 }],
    queryFn: fetchArticles,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['articles', { isFeatured: true, limit: 6, page: 1 }],
    queryFn: fetchArticles,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const breakingNews = breakingData?.articles || []
  const heroArticle = breakingNews[0] || null
  const miniArticles = breakingNews.slice(1)
  const articles = articlesData?.articles || []
  const featuredArticles = featuredData?.articles || []

  useEffect(() => {
    if (breakingError) toast({ title: t.home.errorBreaking, description: t.home.serverTimeout, variant: 'destructive' })
  }, [breakingError]) // eslint-disable-line

  useEffect(() => {
    if (articlesError) toast({ title: t.home.errorNews, description: t.home.serverTimeout, variant: 'destructive' })
  }, [articlesError]) // eslint-disable-line

  const handleShare = useCallback((platform) => {
    shareOnPlatform(platform, { title: 'Bullet Reporter', description: t.home.latestNews, image_url: '/favicon.png', slug: '' })
  }, [t])

  const handleRetry = useCallback(() => { refetchBreaking(); refetchArticles() }, [refetchBreaking, refetchArticles])

  return (
    <Layout>
      {/* Top Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-12">

            {/* ── Breaking News ── */}
            <section>
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-7 bg-red-600 rounded-full inline-block"></span>
                    <span className="w-1 h-5 bg-red-400 rounded-full inline-block"></span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-600 fill-red-600" />
                    {t.home.breakingNews}
                  </h2>
                  {/* Live indicator */}
                  <span className="hidden sm:flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span>
                    LIVE
                  </span>
                </div>
                <button
                  onClick={() => router.push(getLangPath('/news/breaking'))}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors border border-red-200 hover:border-red-400 px-3 py-1 rounded-full"
                >
                  {t.home.viewAll}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {breakingLoading ? (
                <LoadingSpinner message={t.home.loadingBreaking} size="lg" variant="skeleton" />
              ) : breakingError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2 font-medium">{t.home.errorBreaking}</p>
                  <p className="text-gray-400 text-sm mb-4">{t.home.serverTimeout}</p>
                  <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t.home.retry}</button>
                </div>
              ) : breakingNews.length > 0 ? (
                <div>
                  {/* Hero article */}
                  <HeroCard article={heroArticle} onClick={heroArticle?.slug ? goToArticle(heroArticle.slug) : undefined} />

                  {/* Divider */}
                  {miniArticles.length > 0 && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {lang === 'en' ? 'More Breaking' : 'और खबरें'}
                      </span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                  )}

                  {/* Mini-card 2-column grid */}
                  {miniArticles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {miniArticles.map((article) => (
                        <MiniCard
                          key={article.id}
                          article={article}
                          onClick={article.slug ? goToArticle(article.slug) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.home.noBreaking}</div>
              )}
            </section>

            {/* ── Mid Ad ── */}
            <section><AdBanner size="medium" position="middle_banner" /></section>

            {/* ── Latest News ── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-7 bg-red-600 rounded-full inline-block"></span>
                    <span className="w-1 h-5 bg-red-400 rounded-full inline-block"></span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {t.home.latestNews}
                  </h2>
                </div>
                <button
                  onClick={() => router.push(getLangPath('/news'))}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors border border-red-200 hover:border-red-400 px-3 py-1 rounded-full"
                >
                  {t.home.viewAll}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {articlesLoading ? (
                <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" />
              ) : articlesError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2 font-medium">{t.home.errorNews}</p>
                  <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t.home.retry}</button>
                </div>
              ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.map(article => (
                    <NewsCard key={article.id} id={article.id} title={article.title}
                      excerpt={(article.description || '').slice(0, 100) + '...'}
                      category={article.category} categorySlug={article.category_slug} author={article.author_name}
                      publishedAt={article.created_at} readTime={getReadingTime(article.description)}
                      views={article.views || 0} imageUrl={article.image_url}
                      youtubeUrl={article.youtube_url} slug={article.slug} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.home.noNews}</div>
              )}
            </section>

            {/* ── Featured Articles ── */}
            {featuredArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-7 bg-red-600 rounded-full inline-block"></span>
                      <span className="w-1 h-5 bg-red-400 rounded-full inline-block"></span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {lang === 'en' ? 'Special Articles' : 'विशेष लेख'}
                    </h2>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {lang === 'en' ? 'Featured' : 'फीचर्ड'}
                  </span>
                </div>

                {featuredLoading ? (
                  <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredArticles.map((article, i) => (
                      <NewsCard key={article.id} id={article.id} title={article.title}
                        excerpt={(article.description || '').slice(0, 120)}
                        category={article.category} categorySlug={article.category_slug} author={article.editor_name || article.author_name}
                        publishedAt={article.created_at} readTime={getReadingTime(article.contentText || article.description)}
                        views={article.views || 0} imageUrl={article.image_url}
                        youtubeUrl={article.youtube_url} slug={article.slug} featured={i === 0} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Bottom Ad ── */}
            <section><AdBanner size="large" position="bottom_banner" /></section>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
