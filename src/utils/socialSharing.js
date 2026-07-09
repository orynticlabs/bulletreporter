/**
 * Social Sharing Utilities
 * Functions to help with social media sharing, especially WhatsApp
 */

import { SHARING_CONFIG, getTextSettings } from '@/config/sharingConfig';

/**
 * Ensures an image URL is absolute and optimized for social sharing
 * @param {string} imageUrl - The image URL to process
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The absolute image URL
 */
export const getAbsoluteImageUrl = (imageUrl, baseUrl = window.location.origin) => {
  if (!imageUrl) {
    return `${baseUrl}${SHARING_CONFIG.image.fallback}`;
  }
  
  // If it's already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL, make it absolute
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // If it doesn't start with /, add it
  return `${baseUrl}/${imageUrl}`;
};

/**
 * Optimizes image URL for social sharing by adding parameters for better display
 * @param {string} imageUrl - The image URL to optimize
 * @param {Object} options - Optimization options
 * @returns {string} - The optimized image URL
 */
export const optimizeImageForSocialSharing = (imageUrl, options = {}) => {
  const defaultSettings = SHARING_CONFIG.image;
  const {
    width = defaultSettings.width,
    height = defaultSettings.height,
    quality = defaultSettings.quality,
    format = defaultSettings.format
  } = options;
  
  const absoluteUrl = getAbsoluteImageUrl(imageUrl);
  
  // If it's a Cloudinary URL, we can optimize it
  if (absoluteUrl.includes('cloudinary.com')) {
    const url = new URL(absoluteUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', format);
    url.searchParams.set('c', 'limit');
    return url.toString();
  }
  
  // For other URLs, return as is
  return absoluteUrl;
};

/**
 * Generates WhatsApp sharing URL with optimized text and image
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The WhatsApp sharing URL
 */
export const generateWhatsAppShareUrl = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const textSettings = getTextSettings('whatsapp');
  const platformSettings = SHARING_CONFIG.platforms.whatsapp;
  
  const title = (article.title || 'Latest News').substring(0, textSettings.maxTitleLength);
  const description = article.description 
    ? article.description.replace(/<[^>]*>/g, '').substring(0, textSettings.maxDescriptionLength)
    : 'Check out this latest news';
  
  // Create a rich text message with emoji and formatting
  // The URL should be at the end to trigger WhatsApp's link preview with image
  const shareText = platformSettings.includeEmoji 
    ? `📰 *${title}*\n\n${description}\n\n${articleUrl}`
    : `${title}\n\n${description}\n\n${articleUrl}`;
  
  return `${platformSettings.apiUrl}?text=${encodeURIComponent(shareText)}`;
};

/**
 * Generates WhatsApp sharing URL with image preview (for direct image sharing)
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The WhatsApp sharing URL with image
 */
export const generateWhatsAppShareUrlWithImage = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const textSettings = getTextSettings('whatsapp');
  const platformSettings = SHARING_CONFIG.platforms.whatsapp;
  
  const title = (article.title || 'Latest News').substring(0, textSettings.maxTitleLength);
  const description = article.description 
    ? article.description.replace(/<[^>]*>/g, '').substring(0, textSettings.maxDescriptionLength)
    : 'Check out this latest news';
  
  // Create a rich text message that will trigger WhatsApp's link preview
  // The URL should be clean without extra text to ensure preview works
  const shareText = platformSettings.includeEmoji 
    ? `📰 *${title}*\n\n${description}\n\n${articleUrl}`
    : `${title}\n\n${description}\n\n${articleUrl}`;
  
  // WhatsApp will automatically fetch Open Graph meta tags from the URL
  // for image, title, and description preview
  return `${platformSettings.apiUrl}?text=${encodeURIComponent(shareText)}`;
};

/**
 * Generates Facebook sharing URL
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The Facebook sharing URL
 */
export const generateFacebookShareUrl = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const platformSettings = SHARING_CONFIG.platforms.facebook;
  
  // Facebook will automatically fetch Open Graph meta tags from the URL
  // for title, description, and image preview
  return `${platformSettings.apiUrl}?u=${encodeURIComponent(articleUrl)}&quote=${encodeURIComponent(article.title || 'Latest News from Bullet Reporter')}`;
};

/**
 * Generates Twitter/X sharing URL
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The Twitter sharing URL
 */
export const generateTwitterShareUrl = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const textSettings = getTextSettings('twitter');
  const platformSettings = SHARING_CONFIG.platforms.twitter;
  
  const title = (article.title || 'Latest News').substring(0, textSettings.maxTitleLength);
  const tags = article.tags?.length > 0 && platformSettings.includeHashtags 
    ? ` #${article.tags.join(' #')}` 
    : '';
  
  const shareText = `${title}${tags}`;
  
  return `${platformSettings.apiUrl}?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`;
};

/**
 * Generates Telegram sharing URL
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The Telegram sharing URL
 */
export const generateTelegramShareUrl = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const title = article.title || 'Latest News';
  const platformSettings = SHARING_CONFIG.platforms.telegram;
  
  return `${platformSettings.apiUrl}?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`;
};

/**
 * Generates LinkedIn sharing URL
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The LinkedIn sharing URL
 */
export const generateLinkedInShareUrl = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const platformSettings = SHARING_CONFIG.platforms.linkedin;
  
  // LinkedIn will automatically fetch Open Graph meta tags from the URL
  return `${platformSettings.apiUrl}?url=${encodeURIComponent(articleUrl)}`;
};

/**
 * Opens a sharing dialog for the specified platform
 * @param {string} platform - The platform to share on
 * @param {Object} article - The article object
 */
export const shareOnPlatform = (platform, article) => {
  const baseUrl = window.location.origin;
  let shareUrl;
  
  switch (platform) {
    case 'whatsapp':
      shareUrl = generateWhatsAppShareUrlWithImage(article, baseUrl);
      break;
    case 'facebook':
      shareUrl = generateFacebookShareUrl(article, baseUrl);
      break;
    case 'twitter':
    case 'x':
      shareUrl = generateTwitterShareUrl(article, baseUrl);
      break;
    case 'telegram':
      shareUrl = generateTelegramShareUrl(article, baseUrl);
      break;
    case 'linkedin':
      shareUrl = generateLinkedInShareUrl(article, baseUrl);
      break;
    default:
      return;
  }
  
  // Open in new window with proper security attributes
  const newWindow = window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  
  // Fallback for mobile devices
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // For mobile devices, try to open in the same window
    window.location.href = shareUrl;
  }
  
  // Track analytics if enabled
  if (SHARING_CONFIG.analytics.trackShares) {
    trackShareAnalytics(platform, article);
  }
};

/**
 * Validates if an image URL is accessible and returns a fallback if needed
 * @param {string} imageUrl - The image URL to validate
 * @param {string} fallbackUrl - The fallback URL
 * @returns {Promise<string>} - The validated image URL
 */
export const validateImageUrl = async (imageUrl, fallbackUrl = SHARING_CONFIG.image.fallback) => {
  if (!imageUrl) {
    return fallbackUrl;
  }
  
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      timeout: SHARING_CONFIG.performance.timeout
    });
    if (response.ok) {
      return imageUrl;
    }
  } catch {
  }
  
  return fallbackUrl;
};

/**
 * Creates a WhatsApp share link that will show thumbnail preview
 * This function ensures the URL is properly formatted for WhatsApp's link preview
 * @param {Object} article - The article object
 * @param {string} baseUrl - The base URL of the website
 * @returns {string} - The WhatsApp sharing URL
 */
export const createWhatsAppShareWithThumbnail = (article, baseUrl = window.location.origin) => {
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const textSettings = getTextSettings('whatsapp');
  const platformSettings = SHARING_CONFIG.platforms.whatsapp;
  
  const title = (article.title || 'Latest News').substring(0, textSettings.maxTitleLength);
  const description = article.description 
    ? article.description.replace(/<[^>]*>/g, '').substring(0, textSettings.maxDescriptionLength)
    : 'Check out this latest news';
  
  // Create a message that will trigger WhatsApp's link preview
  // Put the URL at the end for better preview generation
  const shareText = platformSettings.includeEmoji 
    ? `📰 ${title}\n\n${description}\n\n${articleUrl}`
    : `${title}\n\n${description}\n\n${articleUrl}`;
  
  return `${platformSettings.apiUrl}?text=${encodeURIComponent(shareText)}`;
};

/**
 * Preloads images for better sharing performance
 * @param {string} imageUrl - The image URL to preload
 */
export const preloadImage = (imageUrl) => {
  if (!imageUrl || !SHARING_CONFIG.performance.preloadImages) return;
  
  const img = new Image();
  img.src = imageUrl;
};

/**
 * Optimizes article data for sharing
 * @param {Object} article - The article object
 * @returns {Object} - Optimized article data
 */
export const optimizeArticleForSharing = (article) => {
  if (!article) return null;
  
  return {
    ...article,
    title: article.title?.trim() || 'Latest News',
    description: article.description 
      ? article.description.replace(/<[^>]*>/g, '').trim().substring(0, SHARING_CONFIG.text.maxDescriptionLength)
      : 'Check out this latest news',
    image_url: article.image_url || null,
    slug: article.slug || '',
    category: article.category || 'News',
    author_name: article.author_name || 'Bullet Reporter'
  };
};

/**
 * Track sharing analytics
 * @param {string} platform - The platform shared on
 * @param {Object} article - The article shared
 */
const trackShareAnalytics = (platform, article) => {
  if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
    window.gtag('event', 'share', {
      method: platform,
      content_type: 'article',
      item_id: article.slug
    });
  }
};

/**
 * Generates a preview link for testing social media sharing
 * @param {Object} article - The article object
 * @param {string} platform - The platform to generate preview for
 * @returns {Object} - Preview data for debugging
 */
export const generateSocialMediaPreview = (article, platform = 'whatsapp') => {
  const baseUrl = window.location.origin;
  const articleUrl = `${baseUrl}/news/${article.slug}`;
  const optimizedImage = article.image_url 
    ? optimizeImageForSocialSharing(article.image_url)
    : getAbsoluteImageUrl(null, baseUrl);
  
  return {
    title: article.title || 'Latest News',
    description: article.description 
      ? article.description.replace(/<[^>]*>/g, '').substring(0, 160)
      : 'Check out this latest news from Bullet Reporter',
    image: optimizedImage,
    url: articleUrl,
    platform: platform,
    author: article.author_name || 'Bullet Reporter',
    category: article.category || 'News',
    publishedAt: article.created_at
  };
};

/**
 * Validates if all required meta tags are present for social sharing
 * @param {Object} article - The article object
 * @returns {Object} - Validation result
 */
export const validateSocialSharingData = (article) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  if (!article.title || article.title.trim().length === 0) {
    validation.isValid = false;
    validation.errors.push('Article title is required');
  }
  
  if (!article.slug) {
    validation.isValid = false;
    validation.errors.push('Article slug is required');
  }
  
  if (!article.image_url) {
    validation.warnings.push('Article image is missing - fallback image will be used');
  }
  
  if (!article.description || article.description.trim().length === 0) {
    validation.warnings.push('Article description is missing');
  }
  
  if (article.title && article.title.length > 60) {
    validation.warnings.push('Article title is longer than recommended for social sharing');
  }
  
  return validation;
}; 
