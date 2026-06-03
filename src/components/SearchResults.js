'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/contexts/SearchContext';
import { Search, X, Loader2, FileText } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const SearchResults = () => {
  const router = useRouter();
  const { 
    searchQuery, 
    searchResults, 
    searchLoading, 
    searchError, 
    showResults, 
    clearSearch 
  } = useSearch();

  if (!showResults || !searchQuery.trim()) {
    return null;
  }

  // Show message if search query doesn't have a complete word
  const hasCompleteWord = searchQuery.trim().includes(' ') || searchQuery.trim().length >= 3;
  if (!hasCompleteWord && searchQuery.trim().length > 0) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm">एक पूरा शब्द टाइप करें या स्पेस दबाएं</p>
        </div>
      </div>
    );
  }

  const handleResultClick = (slug) => {
    router.push(`/news/${slug}`);
    clearSearch();
  };

  const handleClose = () => {
    clearSearch();
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
      {/* Search Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700 text-sm">
            "{searchQuery}" के लिए खोज परिणाम
          </span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Search Results */}
      <div className="max-h-80 overflow-y-auto">
        {searchLoading ? (
          <div className="p-6">
            <LoadingSpinner message="खोज रहे हैं..." size="sm" />
          </div>
        ) : searchError ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-2">
              <FileText className="w-8 h-8 mx-auto mb-2" />
            </div>
            <p className="text-gray-600 text-sm">खोज में त्रुटि हुई</p>
            <p className="text-xs text-gray-500 mt-1">
              कृपया कुछ देर बाद पुनः प्रयास करें
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-2">
              <Search className="w-8 h-8 mx-auto mb-2" />
            </div>
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
            <p className="text-xs text-gray-500 mt-1">
              "{searchQuery}" के लिए कोई लेख नहीं मिला
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {searchResults.map((article) => (
              <div
                key={article.id}
                onClick={() => handleResultClick(article.slug)}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-12 h-9 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {article.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(article.created_at).toLocaleDateString('hi-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {searchResults.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {searchResults.length} परिणाम मिले • क्लिक करें
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults; 