/**
 * Application Configuration
 * 
 * Environment variables are loaded from .env file in project root
 * See .env.example for required variables
 */

/**
 * Normalize URL to ensure it has protocol
 */
const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove trailing slashes
  url = url.trim().replace(/\/+$/, '');
  
  // Add protocol if missing
  if (!url.match(/^https?:\/\//)) {
    url = `https://${url}`;
  }
  
  return url;
};

/**
 * Build base URL from environment variables
 * Format: http://host:port or https://host:port
 */
const getServerUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_SERVER_URL;
  const defaultUrl = 'https://api.zenythium.ru';
  
  if (envUrl) {
    return normalizeUrl(envUrl);
  }
  
  return defaultUrl;
};

/**
 * Get API base URL with version prefix
 * Format: {server}/api/v1
 */
const getApiBaseUrl = (): string => {
  const server = getServerUrl();
  const apiPrefix = import.meta.env.VITE_API_PREFIX || '/api';
  const versionPrefix = import.meta.env.VITE_API_VERSION || '/v1';
  return `${server}${apiPrefix}${versionPrefix}`;
};

const serverUrl = getServerUrl();
const apiBaseUrl = getApiBaseUrl();

// Log URLs in development for debugging
if (import.meta.env.DEV) {
  console.log('[Config] API Server URL:', serverUrl);
  console.log('[Config] API Base URL:', apiBaseUrl);
  console.log('[Config] VITE_API_SERVER_URL env:', import.meta.env.VITE_API_SERVER_URL || '(not set)');
}

export const appConfig = {
  // API Configuration
  // Server URL (without /api/v1)
  apiServerUrl: serverUrl,
  // Full API base URL (with /api/v1)
  apiBaseUrl: apiBaseUrl,
  // API timeout
  apiTimeout: 30000, // 30 seconds

  // App Information
  appName: 'Zenythium Fitness',
  version: '0.0.2',

  // Feature Flags
  enableLogging: import.meta.env.DEV,
  enableDebugMode: import.meta.env.DEV,

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // Cache
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  // Retry Configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 second

  // Toast Configuration
  toastDuration: 3000, // 3 seconds
  toastPosition: 'top' as const,

  // Workout Configuration
  defaultRestTime: 90, // seconds
  autoSaveInterval: 30000, // 30 seconds

  // Yandex SmartCaptcha
  // Client key (site key) - публичный ключ для отображения капчи на клиенте
  // НЕ используйте server key (secret key) - он должен быть только на сервере!
  yandexCaptchaSiteKey: import.meta.env.VITE_YANDEX_CAPTCHA_SITE_KEY || '',
} as const;

export type AppConfig = typeof appConfig;

