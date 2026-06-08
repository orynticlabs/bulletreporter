'use client'

import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { SearchProvider } from '@/contexts/SearchContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { CONTENT_STALE_TIME } from '@/utils/queryConfig'
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

  const { data } = useQuery({
    queryKey: ['public-cache-state'],
    queryFn: fetchPublicCacheState,
    staleTime: 0,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  useEffect(() => {
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
  }, [data?.version, queryClient])

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
