export const APP_CONSTANTS = {
  APP_NAME: 'ScreenCapture Pro',
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    SCREENSHOTS: 'screenshots',
    SETTINGS: 'appSettings',
    USER_DATA: 'userData',
  },
  SCREENSHOT: {
    MAX_COUNT: 50,
    DEFAULT_INTERVAL: 30, // seconds
    QUALITY_OPTIONS: ['low', 'medium', 'high'] as const,
    INTERVAL_OPTIONS: [10, 20, 30] as const, // seconds
  },
  TIME_TRACKING: {
    STORAGE_KEY: 'timeTrackingData',
    SESSION_STORAGE_KEY: 'currentSession',
  },
  UI: {
    ANIMATION_DURATION: 200,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
  },
  API: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
  },
  FIREBASE: {
    MIN_FETCH_INTERVAL: 60000, // 1 minute
    FETCH_TIMEOUT: 10000, // 10 seconds
    REFRESH_INTERVAL: 300000, // 5 minutes
  },
} as const;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const;

export const THEME = {
  COLORS: {
    PRIMARY: '#4F46E5',
    SECONDARY: '#10B981',
    DANGER: '#EF4444',
    WARNING: '#F59E0B',
    SUCCESS: '#10B981',
    INFO: '#3B82F6',
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    '2XL': '3rem',
  },
} as const;

export type ScreenshotQuality = typeof APP_CONSTANTS.SCREENSHOT.QUALITY_OPTIONS[number];
