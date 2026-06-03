'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getTranslations } from '@/i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  // Detect language from URL (/en/... = English, else Hindi)
  const getLangFromPath = useCallback((path) => {
    if (!path) return 'hi'
    return path.startsWith('/en') ? 'en' : 'hi'
  }, [])

  const [lang, setLang] = useState(() => getLangFromPath(pathname))

  // Sync lang when pathname changes
  useEffect(() => {
    setLang(getLangFromPath(pathname))
  }, [pathname, getLangFromPath])

  const toggleLanguage = useCallback(() => {
    const newLang = lang === 'hi' ? 'en' : 'hi'
    setLang(newLang)

    // Build new URL
    let currentPath = pathname || '/'

    if (newLang === 'en') {
      // Add /en prefix if not already there
      if (!currentPath.startsWith('/en')) {
        const newPath = `/en${currentPath === '/' ? '' : currentPath}`
        router.push(newPath)
      }
    } else {
      // Remove /en prefix
      if (currentPath.startsWith('/en')) {
        const newPath = currentPath.slice(3) || '/'
        router.push(newPath)
      }
    }
  }, [lang, pathname, router])

  const t = getTranslations(lang)

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, isEnglish: lang === 'en' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
