'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Search query
  const { data: searchData, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { articles: [] };
      
      // Check if query contains a complete word
      const hasCompleteWord = searchQuery.trim().includes(' ') || searchQuery.trim().length >= 3;
      if (!hasCompleteWord) return { articles: [] };
      
      try {
        const response = await axios.get(`${apiUrl}/news/search`, {
          params: { 
            search: searchQuery,
            limit: 20,
            offset: 0
          }
        });
        return response.data;
      } catch (error) {
        // console.error('Search error:', error);
        throw error;
      }
    },
    enabled: (searchQuery.trim().includes(' ') || searchQuery.trim().length >= 3) && isSearching,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update search results when data changes
  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData.articles || []);
    }
  }, [searchData]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setShowResults(true);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(false);
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Check if query contains a complete word (has space or is a single word)
    const hasCompleteWord = query.trim().includes(' ') || query.trim().length >= 3;
    
    if (hasCompleteWord && query.trim().length > 0) {
      setIsSearching(true);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      setShowResults(true);
    }
  };

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
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 