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
      const result = await fetchPayloadArticles({ isBreaking: true, limit: 10, lang })
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
      <div className="bg-red-600 text-white py-2 px-4">
        <div className="container mx-auto flex items-center space-x-3">
          <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse">
            {t.ticker.label}
          </span>
          <span className="text-sm animate-pulse">{t.ticker.loading}</span>
        </div>
      </div>
    )
  }

  if (breakingNews.length === 0) return null

  const current = breakingNews[currentIndex]

  return (
    <div className="bg-red-600 text-white py-2 px-4 overflow-hidden">
      <div className="container mx-auto flex items-center space-x-3">
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded">
            {t.ticker.label}
          </span>
        </div>
        <button
          className="flex-1 text-left text-sm hover:text-yellow-200 transition-colors line-clamp-1 cursor-pointer"
          onClick={() => current?.slug && handleClick(current.slug)}
        >
          {current?.title}
        </button>
        <button
          onClick={() => router.push(lang === 'en' ? '/en/news/breaking' : '/news/breaking')}
          className="flex-shrink-0 flex items-center text-xs hover:text-yellow-200 transition-colors"
        >
          {t.news.allNews} <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  )
}

export default BreakingNews
