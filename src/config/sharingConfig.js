/**
 * Sharing Configuration
 * Production-ready settings for social media sharing
 */

export const SHARING_CONFIG = {
  // Image optimization settings
  image: {
    width: 1200,
    height: 630,
    quality: 85,
    format: 'auto',
    fallback: '/favicon.png'
  },
  
  // Text optimization settings
  text: {
    maxTitleLength: 60,
    maxDescriptionLength: 160,
    maxUrlLength: 2000
  },
  
  // Platform-specific settings
  platforms: {
    whatsapp: {
      apiUrl: 'https://api.whatsapp.com/send',
      textFormat: 'rich', // rich, simple
      includeEmoji: true,
      includeUrl: true
    },
    facebook: {
      apiUrl: 'https://www.facebook.com/sharer/sharer.php',
      includeImage: true
    },
    twitter: {
      apiUrl: 'https://x.com/intent/tweet',
      maxTextLength: 280,
      includeHashtags: true
    },
    telegram: {
      apiUrl: 'https://t.me/share/url',
      includeImage: true
    },
    linkedin: {
      apiUrl: 'https://www.linkedin.com/sharing/share-offsite/',
      includeImage: true
    }
  },
  
  // Performance settings
  performance: {
    preloadImages: true,
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    timeout: 10000 // 10 seconds
  },
  
  // Security settings
  security: {
    allowExternalLinks: true,
    requireHttps: true,
    sanitizeInput: true,
    validateUrls: true
  },
  
  // Analytics settings
  analytics: {
    trackShares: true,
    trackClicks: true,
    trackPlatforms: true
  }
};

/**
 * Get optimized image settings for a specific platform
 * @param {string} platform - The platform name
 * @returns {Object} - Optimized image settings
 */
export const getImageSettings = (platform) => {
  const baseSettings = SHARING_CONFIG.image;
  
  // Platform-specific optimizations
  switch (platform) {
    case 'whatsapp':
      return {
        ...baseSettings,
        width: 1200,
        height: 630,
        quality: 85
      };
    case 'facebook':
      return {
        ...baseSettings,
        width: 1200,
        height: 630,
        quality: 80
      };
    case 'twitter':
      return {
        ...baseSettings,
        width: 1200,
        height: 600,
        quality: 80
      };
    default:
      return baseSettings;
  }
};

/**
 * Get text settings for a specific platform
 * @param {string} platform - The platform name
 * @returns {Object} - Text settings
 */
export const getTextSettings = (platform) => {
  const baseSettings = SHARING_CONFIG.text;
  
  switch (platform) {
    case 'twitter':
      return {
        ...baseSettings,
        maxTitleLength: 50,
        maxDescriptionLength: 100
      };
    case 'whatsapp':
      return {
        ...baseSettings,
        maxTitleLength: 60,
        maxDescriptionLength: 160
      };
    default:
      return baseSettings;
  }
};

/**
 * Validate sharing configuration
 * @returns {boolean} - Whether configuration is valid
 */
export const validateSharingConfig = () => {
  const requiredFields = ['image', 'text', 'platforms'];
  
  return requiredFields.every(field => 
    SHARING_CONFIG[field] && typeof SHARING_CONFIG[field] === 'object'
  );
};

/**
 * Get production-ready sharing settings
 * @returns {Object} - Production sharing settings
 */
export const getProductionSharingSettings = () => {
  return {
    ...SHARING_CONFIG,
    isProduction: process.env.NODE_ENV === 'production',
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
}; 