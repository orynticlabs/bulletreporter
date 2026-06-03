'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import NewsCard from '@/components/NewsCard'
import AdBanner from '@/components/AdBanner'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'
import { shareOnPlatform } from '@/utils/socialSharing'
import { optimizeArticleData } from '@/utils/performanceUtils'
import { getReadingTime } from '@/utils/timeUtils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, User } from 'lucide-react'
import { DUMMY_ARTICLES } from '@/data/dummyArticles'

const fetchArticles = async ({ queryKey }) => {
  const [, { is_breaking, limit, offset }] = queryKey
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const response = await axios.get(`${apiUrl}/news`, {
    params: { is_breaking, limit, offset },
    timeout: 20000,
  })
  return {
    ...response.data,
    articles: (response.data.articles || []).map(optimizeArticleData),
  }
}

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  const { data: breakingData, isLoading: breakingLoading, error: breakingError, refetch: refetchBreaking } = useQuery({
    queryKey: ['articles', { is_breaking: true, limit: 3, offset: 0 }],
    queryFn: fetchArticles,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useQuery({
    queryKey: ['articles', { is_breaking: false, limit: 10, offset: 0 }],
    queryFn: fetchArticles,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const breakingNews = breakingData?.articles || []
  const articles = articlesData?.articles || []

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

            {/* ── विशेष लेख (Special Articles) ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                  <span className="w-1 h-8 bg-red-600 rounded-full inline-block"></span>
                  {lang === 'en' ? 'Special Articles' : 'विशेष लेख'}
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {lang === 'en' ? 'Featured' : 'फीचर्ड'}
                </span>
              </div>

              {/* Featured big card — first article */}
              <div
                className="relative rounded-2xl overflow-hidden h-64 md:h-80 mb-6 cursor-pointer group shadow-lg"
                onClick={() => router.push(getLangPath(`/article/${DUMMY_ARTICLES[0].slug}`))}
              >
                <img
                  src={DUMMY_ARTICLES[0].image}
                  alt={DUMMY_ARTICLES[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                    {DUMMY_ARTICLES[0].category}
                  </span>
                  <h3 className="text-white font-bold text-lg md:text-2xl leading-snug mb-2">
                    {DUMMY_ARTICLES[0].title}
                  </h3>
                  <div className="flex items-center gap-4 text-white/70 text-xs">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{DUMMY_ARTICLES[0].author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{DUMMY_ARTICLES[0].readTime} {lang === 'en' ? 'min' : 'मिनट'}</span>
                  </div>
                </div>
              </div>

              {/* Remaining 5 articles — grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {DUMMY_ARTICLES.slice(1).map(article => (
                  <div
                    key={article.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                    onClick={() => router.push(getLangPath(`/article/${article.slug}`))}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-red-400" />{article.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-red-400" />{article.readTime} {lang === 'en' ? 'min' : 'मिनट'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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