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
import { useLanguage } from '@/contexts/LanguageContext'
import { Star } from 'lucide-react'

const fetchArticles = async ({ queryKey }) => {
  const [, options] = queryKey
  return fetchPayloadArticles(options)
}

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  const { data: breakingData, isLoading: breakingLoading, error: breakingError, refetch: refetchBreaking } = useQuery({
    queryKey: ['articles', { isBreaking: true, limit: 3, page: 1 }],
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-12">

            {/* ── Breaking News ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1 h-8 bg-red-600 rounded-full inline-block"></span>
                  {t.home.breakingNews}
                </h2>
                <div className="flex space-x-2">
                  <span className="category-tag cursor-pointer" onClick={() => router.push(getLangPath('/news/breaking'))}>{t.home.viewAll}</span>
                  <span className="category-tag cursor-pointer" onClick={() => handleShare('whatsapp')}>{t.home.share}</span>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {breakingNews.map((article, i) => (
                    <NewsCard key={article.id} id={article.id} title={article.title}
                      excerpt={(article.description || '').slice(0, 100) + '...'}
                      category={article.category} author={article.author_name}
                      publishedAt={article.created_at} readTime={getReadingTime(article.description)}
                      views={article.views || 0} imageUrl={article.image_url}
                      youtubeUrl={article.youtube_url} slug={article.slug} featured={i === 0} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.home.noBreaking}</div>
              )}
            </section>

            {/* ── Mid Ad ── */}
            <section><AdBanner size="medium" position="middle_banner" /></section>

            {/* ── Latest News ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1 h-8 bg-red-600 rounded-full inline-block"></span>
                  {t.home.latestNews}
                </h2>
                <div className="flex space-x-2">
                  <span className="category-tag cursor-pointer" onClick={() => router.push(getLangPath('/news'))}>{t.home.viewAll}</span>
                  <span className="category-tag cursor-pointer" onClick={() => handleShare('whatsapp')}>{t.home.share}</span>
                </div>
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
                      category={article.category} author={article.author_name}
                      publishedAt={article.created_at} readTime={getReadingTime(article.description)}
                      views={article.views || 0} imageUrl={article.image_url}
                      youtubeUrl={article.youtube_url} slug={article.slug} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.home.noNews}</div>
              )}
            </section>

            {/* ── विशेष लेख (Featured Payload Articles) ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1 h-8 bg-red-600 rounded-full inline-block"></span>
                  {lang === 'en' ? 'Special Articles' : 'विशेष लेख'}
                </h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {lang === 'en' ? 'From Payload' : 'Payload से'}
                </span>
              </div>

              {featuredLoading ? (
                <LoadingSpinner message={t.home.loadingNews} size="lg" variant="skeleton" />
              ) : featuredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredArticles.map((article, i) => (
                    <NewsCard key={article.id} id={article.id} title={article.title}
                      excerpt={(article.description || '').slice(0, 120)}
                      category={article.category} author={article.editor_name || article.author_name}
                      publishedAt={article.created_at} readTime={getReadingTime(article.contentText || article.description)}
                      views={article.views || 0} imageUrl={article.image_url}
                      youtubeUrl={article.youtube_url} slug={article.slug} featured={i === 0} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {lang === 'en' ? 'No featured Payload articles yet.' : 'अभी कोई फीचर्ड Payload लेख नहीं है।'}
                </div>
              )}
            </section>

            {/* ── Bottom Ad ── */}
            <section><AdBanner size="large" position="bottom_banner" /></section>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24"><Sidebar /></div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
