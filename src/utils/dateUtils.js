/**
 * Date Utilities
 * Functions to handle date validation and formatting
 */

/**
 * Validate if a date string is valid
 * @param {string} dateString - The date string to validate
 * @returns {boolean} - Whether the date is valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

export const getDisplayDateAfterRollover = (date = new Date(), rolloverHour = 0, rolloverMinute = 38) => {
  const displayDate = new Date(date);
  const beforeRollover =
    displayDate.getHours() < rolloverHour ||
    (displayDate.getHours() === rolloverHour && displayDate.getMinutes() < rolloverMinute);

  if (beforeRollover) {
    displayDate.setDate(displayDate.getDate() - 1);
  }

  return displayDate;
};

/**
 * Format date for display with proper validation
 * @param {string} dateString - The date string to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} - Formatted date string
 */
export const formatDisplayDate = (dateString, fallback = 'तारीख उपलब्ध नहीं') => {
  try {
    // Handle null, undefined, or empty date strings
    if (!dateString || dateString === 'Unknown date' || dateString === 'Invalid Date') {
      return fallback;
    }

    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }

    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    // Handle future dates (shouldn't happen but just in case)
    if (diffInMinutes < 0) {
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    if (diffInMinutes < 1) {
      return 'अभी अभी';
    } else if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} मिनट पहले`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} घंटे पहले`;
    } else if (diffInMinutes < 2880) { // Less than 48 hours
      return `कल ${date.toLocaleTimeString('hi-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      // More than 2 days ago, show date with time
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString);
    return fallback;
  }
};

/**
 * Get a standardized date string for API operations
 * @param {string} dateString - The date string to standardize
 * @returns {string} - ISO date string
 */
export const getStandardizedDate = (dateString) => {
  try {
    if (!dateString) {
      return new Date().toISOString();
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  } catch (error) {
    console.warn('Date standardization error:', error, 'for date:', dateString);
    return new Date().toISOString();
  }
};

/**
 * Format date for social sharing
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date for sharing
 */
export const formatDateForSharing = (dateString) => {
  try {
    if (!dateString) {
      return new Date().toLocaleDateString('hi-IN');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('hi-IN');
    }

    return date.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Date sharing format error:', error, 'for date:', dateString);
    return new Date().toLocaleDateString('hi-IN');
  }
};

/**
 * Get relative time string
 * @param {string} dateString - The date string
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (dateString) => {
  try {
    if (!dateString) {
      return 'अभी अभी';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'अभी अभी';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'अभी अभी';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} मिनट पहले`;
    } else if (diffInHours < 24) {
      return `${diffInHours} घंटे पहले`;
    } else if (diffInDays < 7) {
      return `${diffInDays} दिन पहले`;
    } else {
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.warn('Relative time error:', error, 'for date:', dateString);
    return 'अभी अभी';
  }
}; 
