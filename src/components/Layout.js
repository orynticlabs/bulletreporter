'use client'

import React, { useState, useEffect } from 'react'
import NewsHeader from '@/components/header'
import BreakingNews from '@/components/BreakingNews'
import { MessageSquareMore, ChevronUp } from 'lucide-react'
import Footer from '@/components/footer'
import YouTubeShorts from '@/components/YouTubeShorts'

const getExternalUrl = (value = '') => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^(https?:|whatsapp:)/i.test(trimmed)) return trimmed
  if (/^\+?\d[\d\s-]+$/.test(trimmed)) return `https://wa.me/${trimmed.replace(/\D/g, '')}`
  return `https://${trimmed.replace(/^\/+/, '')}`
}

const WHATSAPP_LINK = getExternalUrl(process.env.NEXT_PUBLIC_WHATSAPP_URL || '')

function Layout({ children, showBreakingNews = true }) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NewsHeader />
      {showBreakingNews && <BreakingNews />}

      <main className="flex-1 w-full">
        {children}
      </main>

      <YouTubeShorts />
      <Footer />

      {WHATSAPP_LINK && (
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 rounded-full bg-green-500 p-3 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-green-600 active:scale-95 sm:bottom-6 sm:right-6 md:p-4"
          aria-label="Join WhatsApp Group"
        >
          <MessageSquareMore className="w-5 h-5 md:w-6 md:h-6" />
        </a>
      )}

      {/* Scroll to top button — mobile pe especially useful */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 left-4 z-50 rounded-full bg-red-600 p-3 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-red-700 sm:bottom-6 sm:left-6"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default Layout
