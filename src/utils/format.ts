export const formatUtils = {
  /**
   * Format file size in bytes to human readable format
   */
  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format date to relative time (e.g., "2 minutes ago")
   */
  relativeTime: (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  },

  /**
   * Format time to HH:MM format
   */
  time: (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  /**
   * Format date to MM/DD/YYYY format
   */
  date: (date: Date): string => {
    return date.toLocaleDateString();
  },

  /**
   * Format date and time
   */
  dateTime: (date: Date): string => {
    return `${formatUtils.date(date)} ${formatUtils.time(date)}`;
  },

  /**
   * Format percentage
   */
  percentage: (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  },

  /**
   * Format duration in milliseconds to human readable format
   */
  duration: (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  /**
   * Truncate text to specified length
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Capitalize first letter of each word
   */
  capitalize: (text: string): string => {
    return text.replace(/\b\w/g, l => l.toUpperCase());
  },

  /**
   * Generate a random ID
   */
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
};
