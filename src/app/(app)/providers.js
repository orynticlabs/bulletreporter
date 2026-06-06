'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SearchProvider } from '@/contexts/SearchContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { CONTENT_STALE_TIME } from '@/utils/queryConfig'

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
