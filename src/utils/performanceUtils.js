/**
 * Performance Utilities
 * Functions to optimize data loading and improve user experience
 */

import { getStandardizedDate } from './dateUtils';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cached API request with automatic cache management
 * @param {string} url - The API URL
 * @param {Object} options - Request options
 * @returns {Promise} - Cached or fresh response
 */
export const cachedApiRequest = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Preload images for better performance
 * @param {Array} imageUrls - Array of image URLs to preload
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
export const preloadImages = async (imageUrls) => {
  const promises = imageUrls
    .filter(url => url && url.trim() !== '')
    .map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    });
  
  await Promise.allSettled(promises);
};

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Optimize article data for display
 * @param {Object} article - Article object
 * @returns {Object} - Optimized article object
 */
export const optimizeArticleData = (article) => {
  if (!article) return null;
  
  return {
    ...article,
    title: article.title?.trim() || 'Untitled',
    description: article.description?.trim() || '',
    author_name: article.author_name?.trim() || 'Unknown',
    category: article.category?.trim() || 'Uncategorized',
    created_at: getStandardizedDate(article.created_at),
    views: parseInt(article.views) || 0,
    image_url: article.image_url || null,
    youtube_url: article.youtube_url || null,
    slug: article.slug || '',
  };
};

/**
 * Batch process articles for better performance
 * @param {Array} articles - Array of articles
 * @param {number} batchSize - Size of each batch
 * @returns {Array} - Array of batched articles
 */
export const batchArticles = (articles, batchSize = 10) => {
  const batches = [];
  for (let i = 0; i < articles.length; i += batchSize) {
    batches.push(articles.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Optimize images for different screen sizes
 * @param {string} imageUrl - Original image URL
 * @param {string} size - Size variant (sm, md, lg, xl)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, size = 'md') => {
  if (!imageUrl) return null;
  
  const sizes = {
    sm: { width: 300, height: 200 },
    md: { width: 600, height: 400 },
    lg: { width: 1200, height: 630 },
    xl: { width: 1920, height: 1080 }
  };
  
  const { width, height } = sizes[size] || sizes.md;
  
  // If it's a Cloudinary URL, optimize it
  if (imageUrl.includes('cloudinary.com')) {
    const url = new URL(imageUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('q', '80');
    url.searchParams.set('c', 'limit');
    return url.toString();
  }
  
  // For other URLs, return as is
  return imageUrl;
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      apiCache.delete(key);
    }
  }
};

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export const getCacheStats = () => {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
  };
};

// Clear expired cache every 10 minutes
setInterval(clearExpiredCache, 10 * 60 * 1000); 
