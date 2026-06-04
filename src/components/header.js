'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Menu, Bell, Globe, Share2, Youtube, Facebook, Twitter, Instagram, Loader2, Languages, X, Phone, Mail, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { useSearch } from '@/contexts/SearchContext'
import { useLanguage } from '@/contexts/LanguageContext'
import SearchResults from './SearchResults'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const { t, lang, toggleLanguage } = useLanguage()
  const menuRef = useRef(null)

  const { searchQuery, handleSearchInputChange, handleSearchSubmit, searchLoading } = useSearch()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  // Live clock
  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleTimeString(lang === 'en' ? 'en-IN' : 'hi-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [lang])

  // Sticky shadow on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close menu on route change
  useEffect(() => { setIsMenuOpen(false) }, [pathname])

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${apiUrl}/categories`, { timeout: 15000 })
        const data = response.data
        return Array.isArray(data) ? data : (data?.docs || [])
      } catch {
        return [
          { name: lang === 'en' ? 'State' : 'राज्य', id: 'state' },
          { name: lang === 'en' ? 'National' : 'राष्ट्रीय', id: 'national' },
          { name: lang === 'en' ? 'International' : 'अंतर्राष्ट्रीय', id: 'international' },
          { name: lang === 'en' ? 'Sports' : 'खेल', id: 'sports' },
          { name: lang === 'en' ? 'Entertainment' : 'मनोरंजन', id: 'entertainment' },
          { name: lang === 'en' ? 'Business' : 'व्यवसाय', id: 'business' },
          { name: lang === 'en' ? 'Technology' : 'तकनीक', id: 'tech' },
        ]
      }
    },
    staleTime: 10 * 60 * 1000,
  })

<<<<<<< HEAD
=======
        // Normalize categories responses that wrap results in docs.
  const categoriesArray = Array.isArray(categories)
    ? categories
    : (categories && (Array.isArray(categories.docs) ? categories.docs : []))

  // Build nav URLs based on current language
>>>>>>> ab4375c (Updated Payload Issue)
  const getLangPath = (path) => lang === 'en' ? `/en${path}` : path

  const mainCategories = [
    { name: t.header.mainNews, href: getLangPath('/') },
    ...categories.map(cat => ({
      name: cat.name,
      href: getLangPath(`/category/${encodeURIComponent(cat.name)}`)
    }))
  ]

  const socialLinks = [
    { name: 'YouTube', icon: Youtube, href: '#', color: 'text-red-600' },
    { name: 'Facebook', icon: Facebook, href: '#', color: 'text-blue-600' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'text-sky-500' },
    { name: 'Instagram', icon: Instagram, href: '#', color: 'text-pink-600' },
  ]

  const isActive = (href) => {
    const cleanHref = href.replace(/^\/en/, '') || '/'
    const cleanPath = (pathname || '').replace(/^\/en/, '') || '/'
    if (cleanHref === '/') return cleanPath === '/'
    return cleanPath.startsWith(cleanHref)
  }

  const handleNavClick = (href) => {
    router.push(href)
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-lg border-b-2 border-red-600" ref={menuRef}>

      {/* ── Top Bar ── */}
      <div className="bg-red-700 text-white text-xs">
        <div className="container mx-auto px-4 py-1.5">
          <div className="flex items-center justify-between gap-2">

            {/* Left: Date + Time */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 opacity-80" />
                <span className="font-medium">{t.header.language}</span>
              </div>
              <span className="hidden sm:block opacity-80">
                {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
              {currentTime && (
                <span className="hidden md:flex items-center gap-1 bg-red-800/50 px-2 py-0.5 rounded font-mono">
                  🕐 {currentTime}
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-all font-bold border border-white/30 text-xs"
                title={`Switch to ${t.header.switchTo}`}
              >
                <Languages className="w-3 h-3" />
                <span>{lang === 'hi' ? 'अ→A' : 'A→अ'}</span>
              </button>

              {/* News Alert */}
              <button className="flex items-center gap-1 hover:bg-red-800 px-2 py-1 rounded transition-colors">
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.header.newsAlerts}</span>
              </button>

              {/* Social Share Dropdown */}
              <div className="relative">
                <button
                  className="hover:bg-red-800 p-1.5 rounded transition-colors"
                  onClick={() => setIsSocialOpen(!isSocialOpen)}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                {isSocialOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 font-medium">
                      {t.header.followUs}
                    </div>
                    {socialLinks.map((s) => (
                      <a key={s.name} href={s.href}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 transition-colors"
                        onClick={() => setIsSocialOpen(false)}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                        <span className="text-gray-700 text-sm font-medium">{s.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact icons */}
              <a href="tel:+919425470033" className="hidden lg:flex hover:bg-red-800 p-1.5 rounded transition-colors" title="+91 9425470033">
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a href="mailto:bulletreporter1@gmail.com" className="hidden lg:flex hover:bg-red-800 p-1.5 rounded transition-colors" title="bulletreporter1@gmail.com">
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Header (Logo + Search) ── */}
      <div className={`bg-white sticky top-0 z-40 transition-shadow duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-sm'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0"
              onClick={() => router.push(getLangPath('/'))}
            >
              <img
                src="/logo.png"
                alt="Bullet Reporter"
                className="h-16 md:h-20 w-auto rounded-lg border-2 border-red-600 shadow-md bg-white object-contain"
              />
            </div>

            {/* Center: Breaking news marquee — desktop only */}
            <div className="hidden lg:flex flex-1 items-center overflow-hidden mx-4">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mr-2 flex-shrink-0 animate-pulse">
                LIVE
              </span>
              <div className="overflow-hidden flex-1">
                <p className="text-sm text-gray-600 truncate">
                  {lang === 'en'
                    ? 'Welcome to Bullet Reporter — Your trusted source for fast Hindi news'
                    : 'बुलेट रिपोर्टर में आपका स्वागत है — सबसे तेज़ और विश्वसनीय हिंदी समाचार'}
                </p>
              </div>
            </div>

            {/* Right: Search */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="search"
                    placeholder={t.header.searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-64 lg:w-80 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
                  />
                  {searchLoading ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </form>
                <SearchResults />
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop Navigation ── */}
      <div className="bg-red-600 hidden md:block">
        <div className="container mx-auto px-4">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-3 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span className="text-white text-sm">{t.header.loadingCategories}</span>
            </div>
          ) : (
            <ul className="flex flex-wrap">
              {mainCategories.map((category) => (
                <li key={category.name}>
                  <button
                    onClick={() => handleNavClick(category.href)}
                    className={`px-5 py-3 text-white text-sm font-medium transition-all relative group ${
                      isActive(category.href)
                        ? 'bg-red-700 border-b-2 border-white'
                        : 'hover:bg-red-700'
                    }`}
                  >
                    {category.name}
                    {/* Active dot indicator */}
                    {isActive(category.href) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-red-100 shadow-2xl absolute w-full z-50">
          {/* Mobile Search */}
          <div className="px-4 pt-4 pb-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
              />
              {searchLoading ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              )}
            </form>
            <SearchResults />
          </div>

          {/* Mobile Nav Links */}
          <nav className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {mainCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleNavClick(category.href)}
                  className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(category.href)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile Social + Language */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {socialLinks.map((s) => (
                  <a key={s.name} href={s.href}
                    className="bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors" title={s.name}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </a>
                ))}
              </div>
              {/* Language toggle in mobile */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-red-700"
              >
                <Languages className="w-4 h-4" />
                {lang === 'hi' ? 'English' : 'हिंदी'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close social dropdown */}
      {isSocialOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsSocialOpen(false)} />
      )}
    </header>
  )
}

export default Header