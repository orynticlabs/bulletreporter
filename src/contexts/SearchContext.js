'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPayloadArticles } from '@/utils/payloadArticles'

const SearchContext = createContext()

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)

  const isQueryReady = isSearching && (searchQuery.trim().includes(' ') || searchQuery.trim().length >= 3)

  const { data: searchData, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { articles: [] }
      return fetchPayloadArticles({ search: searchQuery.trim(), limit: 20 })
    },
    enabled: isQueryReady,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData.articles || [])
    }
  }, [searchData])

  const handleSearch = (query) => {
    setSearchQuery(query)
    setIsSearching(true)
    setShowResults(true)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    setIsSearching(false)
  }

  const handleSearchInputChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    const hasCompleteWord = query.trim().includes(' ') || query.trim().length >= 3
    if (hasCompleteWord && query.trim().length > 0) {
      setIsSearching(true)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      setShowResults(true)
    }
  }

  const value = {
    searchQuery,
    searchResults,
    searchLoading,
    searchError,
    showResults,
    isSearching,
    handleSearch,
    handleSearchInputChange,
    handleSearchSubmit,
    clearSearch,
    setShowResults
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}
