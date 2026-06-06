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
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)

  const trimmedQuery = searchQuery.trim()
  const trimmedDebouncedQuery = debouncedQuery.trim()
  const isQueryReady = isSearching && trimmedDebouncedQuery.length >= 2

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchData, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', trimmedDebouncedQuery],
    queryFn: async () => {
      if (!trimmedDebouncedQuery) return { articles: [] }
      return fetchPayloadArticles({ search: trimmedDebouncedQuery, limit: 8 })
    },
    enabled: isQueryReady,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData.articles || [])
    }
  }, [searchData])

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setSearchResults([])
    }
  }, [trimmedQuery])

  const handleSearch = (query) => {
    setSearchQuery(query)
    setIsSearching(true)
    setShowResults(true)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedQuery('')
    setSearchResults([])
    setShowResults(false)
    setIsSearching(false)
  }

  const handleSearchInputChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim().length >= 2) {
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
