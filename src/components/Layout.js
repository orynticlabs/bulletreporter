'use client'

import React, { useState, useEffect } from 'react'
import NewsHeader from '@/components/header'
import BreakingNews from '@/components/BreakingNews'
import { MessageSquareMore, ChevronUp } from 'lucide-react'
import Footer from '@/components/footer'

const WHATSAPP_LINK = 'https://wa.me/919425470033'

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

      <Footer />

      {/* WhatsApp floating button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-3 md:p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Join WhatsApp Group"
      >
        <MessageSquareMore className="w-5 h-5 md:w-6 md:h-6" />
      </a>

      {/* Scroll to top button — mobile pe especially useful */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default Layout
