'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import NewsCard from '@/components/NewsCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import AdBanner from '@/components/AdBanner'
import { useQuery } from '@tanstack/react-query'
import { getReadingTime } from '@/utils/timeUtils'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { useLanguage } from '@/contexts/LanguageContext'
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react'

const LIMIT = 12

export default function BreakingNewsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { t, lang } = useLanguage()

  const { data, isLoading, error } = useQuery({
    queryKey: ['breaking-news-page', page],
    queryFn: async () => {
      return fetchPayloadArticles({ isBreaking: true, limit: LIMIT, page })
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    keepPreviousData: true,
  })

  const articles = data?.articles || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || Math.ceil(total / LIMIT)

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
            <Zap className="w-8 h-8 text-red-500" />
            {t.home.breakingNews}
          </h1>
          <button onClick={() => router.push(getLangPath('/'))}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <ChevronLeft className="w-4 h-4" /> {t.news.goBack}
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner message={t.home.loadingBreaking} size="lg" variant="skeleton" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <NewsCard key={article.id} id={article.id} title={article.title}
                  excerpt={(article.description || '').slice(0, 100) + '...'}
                  category={article.category} categorySlug={article.category_slug} author={article.editor_name || article.author_name}
                  publishedAt={article.created_at} readTime={getReadingTime(article.contentText || article.description)}
                  views={article.views || 0} imageUrl={article.image_url}
                  youtubeUrl={article.youtube_url} slug={article.slug} featured={i === 0} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" /> {t.news.previous}
                </button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40">
                  {t.news.next} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
        <div className="mt-8"><AdBanner size="large" position="bottom_banner" /></div>
      </main>
    </Layout>
  )
}
