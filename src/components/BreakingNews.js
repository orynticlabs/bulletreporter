'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Zap, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchPayloadArticles } from '@/utils/payloadArticles'
import { CONTENT_REFETCH_INTERVAL, CONTENT_STALE_TIME } from '@/utils/queryConfig'

function BreakingNews() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const { t, lang } = useLanguage()

  const { data: breakingNews = [], isLoading } = useQuery({
    queryKey: ['breaking-ticker', lang],
    queryFn: async () => {
      const result = await fetchPayloadArticles({ isBreaking: true, limit: 10, lang, summary: true })
      return result.articles || []
    },
    staleTime: CONTENT_STALE_TIME,
    refetchInterval: CONTENT_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  useEffect(() => {
    if (breakingNews.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % breakingNews.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [breakingNews.length])

  const handleClick = useCallback((slug) => {
    const encodedSlug = encodeURIComponent(slug)
    const path = lang === 'en' ? `/en/news/${encodedSlug}` : `/news/${encodedSlug}`
    router.push(path)
  }, [lang, router])

  if (isLoading) {
    return (
      <div className="mt-0 bg-red-600 px-3 py-2 text-white sm:px-4">
        <div className="container mx-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="shrink-0 animate-pulse rounded bg-white px-2 py-1 text-xs font-bold text-red-600">
            {t.ticker.label}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm animate-pulse">{t.ticker.loading}</span>
        </div>
      </div>
    )
  }

  if (breakingNews.length === 0) return null

  const current = breakingNews[currentIndex]

  return (
    <div className="mt-0 overflow-hidden bg-red-600 px-3 py-2 text-white sm:px-4">
      <div className="container mx-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded">
            {t.ticker.label}
          </span>
        </div>
        <button
          className="min-w-0 flex-1 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm leading-6 transition-colors hover:text-yellow-200"
          onClick={() => current?.slug && handleClick(current.slug)}
          title={current?.title || ''}
        >
          {current?.title}
        </button>
        <button
          onClick={() => router.push(lang === 'en' ? '/en/news/breaking' : '/news/breaking')}
          className="flex shrink-0 items-center text-xs transition-colors hover:text-yellow-200"
          aria-label={t.news.allNews}
        >
          <span className="hidden sm:inline">{t.news.allNews}</span>
          <ChevronRight className="h-4 w-4 sm:ml-1 sm:h-3 sm:w-3" />
        </button>
      </div>
    </div>
  )
}

export default BreakingNews
