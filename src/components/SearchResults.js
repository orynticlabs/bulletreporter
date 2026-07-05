'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/contexts/SearchContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Search, X, FileText } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const SearchResults = () => {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const { searchQuery, searchResults, searchLoading, searchError, showResults, clearSearch } = useSearch()

  if (!showResults || !searchQuery.trim()) return null

  const langPath = (path) => lang === 'en' ? `/en${path}` : path
  const dateFmt = lang === 'en' ? 'en-IN' : 'hi-IN'

  if (searchQuery.trim().length < 2) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
        <p className="text-gray-600 text-sm text-center">{t.search.typeChars}</p>
      </div>
    )
  }

  const handleResultClick = (slug) => {
    if (!slug) return
    router.push(langPath(`/news/${encodeURIComponent(slug)}`))
    clearSearch()
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 max-h-[min(24rem,calc(100vh-9rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex min-w-0 items-center space-x-2">
          <Search className="h-4 w-4 shrink-0 text-gray-500" />
          <span className="min-w-0 truncate text-sm font-medium text-gray-700">
            &ldquo;{searchQuery}&rdquo; {t.search.suggestionsFor}
          </span>
        </div>
        <button onClick={clearSearch} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-[min(20rem,calc(100vh-13rem))] overflow-y-auto">
        {searchLoading ? (
          <div className="p-6">
            <LoadingSpinner message={t.search.searching} size="sm" />
          </div>
        ) : searchError ? (
          <div className="p-6 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-gray-600 text-sm">{t.search.searchFailed}</p>
            <p className="text-xs text-gray-500 mt-1">{t.search.tryAgain}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-6 text-center">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 text-sm">{t.search.noSuggestions}</p>
            <p className="text-xs text-gray-500 mt-1">
              &ldquo;{searchQuery}&rdquo; {t.search.noArticleFound}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {searchResults.map((article) => (
              <button
                type="button"
                key={article.id}
                onClick={() => handleResultClick(article.slug)}
                className="block w-full p-3 text-left hover:bg-red-50 cursor-pointer transition-colors focus:outline-none focus:bg-red-50"
              >
                <div className="flex min-w-0 items-start space-x-3">
                  {article.image_url && (
                    <img src={article.image_url} alt={article.title}
                      className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{article.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{article.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {(article.categories?.length ? article.categories : [article.category]).filter(Boolean).slice(0, 2).map((category, index) => (
                        <span key={`${category}-${index}`} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">{category}</span>
                      ))}
                      {article.created_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(article.created_at).toLocaleDateString(dateFmt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {searchResults.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            {searchResults.length} {t.search.results} &bull; {t.search.clickToRead}
          </p>
        </div>
      )}
    </div>
  )
}

export default SearchResults
