'use client'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchProvider } from '@/contexts/SearchContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { CONTENT_STALE_TIME, PUBLIC_CACHE_CHECK_INTERVAL } from '@/utils/queryConfig'
import { fetchPublicCacheState } from '@/utils/publicCacheState'

const PUBLIC_DATA_QUERY_KEYS = new Set([
  'articles',
  'all-news',
  'category-news',
  'breaking-news-page',
  'breaking-ticker',
  'header-alerts',
  'suggested',
  'article',
  'video-news',
  'video-news-list',
  'video-news-detail',
  'categories',
  'site-settings',
  'advertisements',
  'comments',
])

function PublicCacheInvalidator() {
  const queryClient = useQueryClient()
  const lastVersion = useRef(null)
  const lastCheckAt = useRef(0)
  const pendingCheck = useRef(null)

  const checkForUpdates = useCallback(async ({ force = false } = {}) => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

    const now = Date.now()
    if (now - lastCheckAt.current < PUBLIC_CACHE_CHECK_INTERVAL) return
    if (pendingCheck.current) return pendingCheck.current

    lastCheckAt.current = now
    pendingCheck.current = fetchPublicCacheState({ forceRefresh: true })
      .then((data) => {
        const version = data?.version
        if (!version) return

        if (lastVersion.current === null) {
          lastVersion.current = version
          return
        }

        if (lastVersion.current === version) return

        lastVersion.current = version
        queryClient.invalidateQueries({
          predicate: (query) => PUBLIC_DATA_QUERY_KEYS.has(query.queryKey?.[0]),
        })
      })
      .catch(() => {})
      .finally(() => {
        pendingCheck.current = null
      })

    return pendingCheck.current
  }, [queryClient])

  useEffect(() => {
    checkForUpdates({ force: true })

    const onVisibleOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates({ force: true })
      }
    }

    const intervalId = window.setInterval(() => {
      checkForUpdates()
    }, PUBLIC_CACHE_CHECK_INTERVAL)

    document.addEventListener('visibilitychange', onVisibleOrFocus)
    window.addEventListener('focus', onVisibleOrFocus)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibleOrFocus)
      window.removeEventListener('focus', onVisibleOrFocus)
    }
  }, [checkForUpdates])

  return null
}

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data becomes stale after 30 s — shorter than the 2-min refetch
        // interval so the interval actually triggers new network requests.
        staleTime: CONTENT_STALE_TIME,
        gcTime: 10 * 60 * 1000,        // keep unused cache for 10 min
        retry: 1,
        retryDelay: 2000,
        // Refetch when the user returns to the tab after being away
        refetchOnWindowFocus: true,
        // Never refetch when the browser tab is hidden/backgrounded —
        // avoids wasting API quota while the user isn't looking
        refetchIntervalInBackground: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <PublicCacheInvalidator />
      <LanguageProvider>
        <SearchProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </SearchProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
