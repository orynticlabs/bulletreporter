/**
 * Time Display Utilities
 * Advanced time formatting functions for news articles
 */

/**
 * Get upload time with context for news articles
 * @param {string} dateString - The date string
 * @param {boolean} showSeconds - Whether to show seconds
 * @returns {string} - Formatted upload time
 */
export const getUploadTime = (dateString, showSeconds = false) => {
  try {
    if (!dateString) {
      return 'अपलोड समय उपलब्ध नहीं';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'अपलोड समय उपलब्ध नहीं';
    }

    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    // If less than a minute ago
    if (diffInMinutes < 1) {
      return 'अभी-अभी अपलोड किया गया';
    }
    
    // If less than an hour ago
    if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} मिनट पहले अपलोड`;
    }
    
    // If less than 24 hours ago
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} घंटे पहले अपलोड`;
    }
    
    // If less than 48 hours ago
    if (diffInMinutes < 2880) {
      const timeString = date.toLocaleTimeString('hi-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        ...(showSeconds && { second: '2-digit' }),
        hour12: true 
      });
      return `कल ${timeString} पर अपलोड`;
    }
    
    // If this year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        ...(showSeconds && { second: '2-digit' }),
        hour12: true
      });
    }
    
    // If previous year
    return date.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      hour12: true
    });
    
  } catch {
    return 'अपलोड समय उपलब्ध नहीं';
  }
};

/**
 * Get a simple timestamp for article metadata
 * @param {string} dateString - The date string
 * @returns {string} - Simple timestamp
 */
export const getSimpleTimestamp = (dateString) => {
  try {
    if (!dateString) {
      return 'N/A';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
  } catch {
    return 'N/A';
  }
};

/**
 * Get reading time estimate based on content length
 * @param {string} content - The article content
 * @param {number} wordsPerMinute - Reading speed (default: 200 words per minute for Hindi)
 * @returns {string} - Estimated reading time in Hindi
 */
export const getReadingTime = (content, wordsPerMinute = 150) => {
  try {
    if (!content || content.trim().length === 0) {
      return '1 मिनट';
    }

    // Remove HTML tags and count words
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = textContent.split(/\s+/).length;
    
    if (wordCount === 0) {
      return '1 मिनट';
    }
    
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (readingTimeMinutes === 1) {
      return '1 मिनट';
    } else if (readingTimeMinutes < 60) {
      return `${readingTimeMinutes} मिनट`;
    } else {
      const hours = Math.floor(readingTimeMinutes / 60);
      const minutes = readingTimeMinutes % 60;
      
      if (minutes === 0) {
        return `${hours} घंटे`;
      } else {
        return `${hours} घंटे ${minutes} मिनट`;
      }
    }
    
  } catch {
    return '3 मिनट';
  }
};

/**
 * Format time for breaking news display
 * @param {string} dateString - The date string
 * @returns {string} - Formatted time for breaking news
 */
export const getBreakingNewsTime = (dateString) => {
  try {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'अभी';
    } else if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} मिनट पहले`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} घंटे पहले`;
    } else {
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short'
      });
    }
    
  } catch {
    return '';
  }
};

/**
 * Get IST time display
 * @param {string} dateString - The date string
 * @returns {string} - IST formatted time
 */
export const getISTTime = (dateString) => {
  try {
    if (!dateString) {
      return 'N/A';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    // Convert to IST
    const istOptions = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    return date.toLocaleString('hi-IN', istOptions) + ' IST';
    
  } catch {
    return 'N/A';
  }
};
