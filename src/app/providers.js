'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SearchProvider } from '@/contexts/SearchContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 3 * 60 * 1000,    // 3 minutes
        gcTime: 10 * 60 * 1000,       // 10 minutes cache
        retry: 1,
        retryDelay: 2000,
        refetchOnWindowFocus: false,  // Performance: no refetch on tab switch
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
