'use client'

import { useState, useEffect } from 'react'
import { Search, Menu, Bell, Globe, Share2, Youtube, Facebook, Twitter, Instagram, Loader2, Languages } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { useSearch } from '@/contexts/SearchContext'
import { useLanguage } from '@/contexts/LanguageContext'
import SearchResults from './SearchResults'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { t, lang, toggleLanguage } = useLanguage()

  const {
    searchQuery,
    handleSearchInputChange,
    handleSearchSubmit,
    searchLoading
  } = useSearch()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${apiUrl}/categories`, { timeout: 15000 })
        return response.data
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

  // Build nav URLs based on current language
  const getLangPath = (path) => lang === 'en' ? `/en${path}` : path

  const mainCategories = [
    { name: t.header.mainNews, href: getLangPath('/') },
    ...categories.map(cat => ({
      name: cat.name,
      href: getLangPath(`/category/${encodeURIComponent(cat.name)}`)
    }))
  ]

  const socialLinks = [
    { name: 'YouTube', icon: Youtube, href: '#', color: 'text-red-600 hover:text-red-700' },
    { name: 'Facebook', icon: Facebook, href: '#', color: 'text-blue-600 hover:text-blue-700' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'text-blue-400 hover:text-blue-500' },
    { name: 'Instagram', icon: Instagram, href: '#', color: 'text-pink-600 hover:text-pink-700' },
  ]

  const isActive = (href) => {
    const cleanHref = href.replace(/^\/en/, '') || '/'
    const cleanPath = pathname.replace(/^\/en/, '') || '/'
    if (cleanHref === '/') return cleanPath === '/'
    return cleanPath.startsWith(cleanHref)
  }

  const handleNavClick = (href) => {
    router.push(href)
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-lg border-b-2 border-red-600">
      {/* Top Bar */}
      <div className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span className="font-medium">{t.header.language}</span>
              </div>
              <span className="hidden sm:block">
                {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all duration-200 font-bold text-xs border border-white/40"
                title={`Switch to ${t.header.switchTo}`}
              >
                <Languages className="w-3.5 h-3.5 mr-1" />
                {t.header.languageCode === 'HI' ? (
                  <span>A → अ</span>
                ) : (
                  <span>अ → A</span>
                )}
              </button>

              <button className="flex items-center space-x-1 hover:bg-red-700 px-2 py-1 rounded transition-colors">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">{t.header.newsAlerts}</span>
              </button>

              {/* Social dropdown */}
              <div className="relative">
                <button
                  className="hover:bg-red-700 p-1 rounded transition-colors"
                  onClick={() => setIsSocialOpen(!isSocialOpen)}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {isSocialOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {t.header.followUs}
                    </div>
                    {socialLinks.map((social) => (
                      <a key={social.name} href={social.href}
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsSocialOpen(false)}>
                        <social.icon className={`w-4 h-4 ${social.color}`} />
                        <span className="text-gray-700 font-medium">{social.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 ml-10 cursor-pointer" onClick={() => router.push(getLangPath('/'))}>
              <img src="/logo.png" alt="Bullet Reporter Logo"
                className="h-20 w-auto rounded-lg shadow-md border-2 border-red-600 bg-white" />
            </div>

            {/* Search - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="search"
                    placeholder={t.header.searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  {searchLoading ? (
                    <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </form>
                <SearchResults />
              </div>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={() => router.push('/admin')}
              >
                {t.header.adminPanel}
              </button>
            </div>

            <button
              className="md:hidden text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-red-600">
        <div className="container mx-auto px-4">
          <nav className="hidden md:block">
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="ml-2 text-white">{t.header.loadingCategories}</span>
              </div>
            ) : (
              <ul className="flex flex-wrap">
                {mainCategories.map((category) => (
                  <li key={category.name}>
                    <button
                      onClick={() => handleNavClick(category.href)}
                      className={`px-6 py-3 text-white font-medium transition-colors relative ${
                        isActive(category.href)
                          ? 'bg-red-700 border-b-2 border-white'
                          : 'hover:bg-red-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-red-600 py-4">
              <div className="flex flex-col space-y-1">
                {mainCategories.map((category) => (
                  <button key={category.name}
                    onClick={() => handleNavClick(category.href)}
                    className={`text-left px-4 py-2 text-white font-medium rounded transition-colors ${
                      isActive(category.href) ? 'bg-red-700' : 'hover:bg-red-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 px-4">
                <div className="relative">
                  <form onSubmit={handleSearchSubmit}>
                    <input type="search" placeholder={t.header.searchPlaceholder}
                      value={searchQuery} onChange={handleSearchInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    />
                    {searchLoading ? (
                      <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                  </form>
                  <SearchResults />
                </div>
                <div className="mt-4 pt-4 border-t border-red-500">
                  <div className="text-white text-sm mb-2">{t.header.followUs}:</div>
                  <div className="flex space-x-4">
                    {socialLinks.map((social) => (
                      <a key={social.name} href={social.href}
                        className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title={social.name}
                      >
                        <social.icon className={`w-4 h-4 ${social.color}`} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSocialOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsSocialOpen(false)} />
      )}
    </header>
  )
}

export default Header
