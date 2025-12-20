import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError, TimeAnalyticsResponse, RecordsResponse, MetricsResponse } from '@/types/api';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/error-handler';
import { Capacitor } from '@capacitor/core';
import { API_ENDPOINTS } from '../constants/api-endpoints';

/**
 * Enhanced API Client with interceptors, retry logic, and error transformation
 */

// Validate and log baseURL
const baseURL = appConfig.apiBaseUrl;
if (import.meta.env.DEV || !Capacitor.isNativePlatform()) {
  console.log('[API Client] Base URL:', baseURL);
  console.log('[API Client] Is absolute URL:', baseURL.startsWith('http://') || baseURL.startsWith('https://'));
  console.log('[API Client] Platform:', Capacitor.getPlatform());
  console.log('[API Client] With Credentials:', !Capacitor.isNativePlatform());
}

// Set withCredentials globally for web platform (required for Laravel Sanctum stateful auth)
if (!Capacitor.isNativePlatform()) {
  axios.defaults.withCredentials = true;
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: appConfig.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable credentials (cookies) for web platform (required for Laravel Sanctum stateful auth)
  withCredentials: !Capacitor.isNativePlatform(),
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

// Request retry configuration
interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  _csrfRetryCount?: number; // Track CSRF retry attempts to prevent infinite loops
}

/**
 * Update CSRF token in axios defaults (for compatibility)
 * This ensures X-XSRF-TOKEN is available globally
 */
function updateCsrfTokenInDefaults(): void {
  if (Capacitor.isNativePlatform()) {
    return;
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    try {
      const decodedToken = decodeURIComponent(csrfToken);
      // Set in axios defaults for global availability
      axios.defaults.headers.common['X-XSRF-TOKEN'] = decodedToken;
      axios.defaults.headers.common['X-CSRF-TOKEN'] = decodedToken;
    } catch (error) {
      // If decode fails, use raw token
      axios.defaults.headers.common['X-XSRF-TOKEN'] = csrfToken;
      axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    }
  } else {
    // Remove if not available
    delete axios.defaults.headers.common['X-XSRF-TOKEN'];
    delete axios.defaults.headers.common['X-CSRF-TOKEN'];
  }
}

/**
 * Get CSRF token from cookie (for web platform only)
 */
function getCsrfToken(): string | null {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    // Laravel Sanctum uses XSRF-TOKEN cookie
    const name = 'XSRF-TOKEN';
    const cookies = document.cookie;
    
    if (!cookies) {
      if (import.meta.env.DEV) {
        console.warn('[CSRF] No cookies found in document.cookie');
      }
      return null;
    }

    // Method 1: Direct regex match (most reliable)
    const regex = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`);
    const match = cookies.match(regex);
    
    if (match && match[1]) {
      const token = match[1].trim();
      if (token) {
        if (import.meta.env.DEV) {
          console.log('[CSRF] Token found via regex:', token.substring(0, 30) + '...');
        }
        return token;
      }
    }
    
    // Method 2: Split method (fallback)
    const parts = cookies.split(';');
    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      if (key.trim() === name && valueParts.length > 0) {
        const token = valueParts.join('=').trim();
        if (token) {
          if (import.meta.env.DEV) {
            console.log('[CSRF] Token found via split:', token.substring(0, 30) + '...');
          }
          return token;
        }
      }
    }
    
    if (import.meta.env.DEV) {
      console.warn('[CSRF] Token not found in cookies:', cookies);
    }
    return null;
  } catch (error) {
    logger.info('Error reading CSRF token from cookie:', error);
    return null;
  }
}

/**
 * Debug function to check CSRF token and cookie status
 */
function debugCsrfStatus(): void {
  if (Capacitor.isNativePlatform()) {
    console.log('[CSRF Debug] Native platform - CSRF not required');
    return;
  }

  const cookies = document.cookie;
  const csrfToken = getCsrfToken();
  
  console.group('[CSRF Debug]');
  console.log('All cookies:', cookies || '(no cookies)');
  console.log('XSRF-TOKEN cookie exists:', cookies.includes('XSRF-TOKEN'));
  console.log('CSRF token extracted:', csrfToken ? `${csrfToken.substring(0, 20)}...` : '(not found)');
  console.log('Platform:', Capacitor.getPlatform());
  console.log('API Server URL:', appConfig.apiServerUrl);
  console.log('API Base URL:', appConfig.apiBaseUrl);
  console.log('With Credentials:', !Capacitor.isNativePlatform());
  console.groupEnd();
}

// Request interceptor to add authorization token and CSRF token (for web)
apiClient.interceptors.request.use(
  (config) => {
    // Add authorization token
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for web platform (required for Laravel Sanctum stateful auth)
    // X-XSRF-TOKEN must be set from document.cookie['XSRF-TOKEN'] for all state-changing methods
    if (!Capacitor.isNativePlatform()) {
      const method = config.method?.toUpperCase();
      // CSRF token required for POST, PUT, DELETE, PATCH (state-changing methods)
      if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // If header already set (e.g., from retry), use it, otherwise get from cookie
        if (config.headers && config.headers['X-XSRF-TOKEN']) {
          console.log(`[CSRF] Header already set for ${method} ${config.url}, using existing`);
        } else {
          // Get CSRF token from document.cookie['XSRF-TOKEN']
          const csrfToken = getCsrfToken();
          if (csrfToken && config.headers) {
            try {
              // Decode URL-encoded token (Laravel Sanctum encodes it in cookie)
              // X-XSRF-TOKEN header must be set from document.cookie['XSRF-TOKEN']
              const decodedToken = decodeURIComponent(csrfToken);
              config.headers['X-XSRF-TOKEN'] = decodedToken;
              // Some Laravel versions also accept X-CSRF-TOKEN
              config.headers['X-CSRF-TOKEN'] = decodedToken;
              // Also update defaults for global availability
              updateCsrfTokenInDefaults();
              console.log(`[CSRF] ✅ X-XSRF-TOKEN added to ${method} ${config.url}`);
              console.log(`[CSRF] Token from document.cookie['XSRF-TOKEN'], length: ${decodedToken.length}`);
              console.log(`[CSRF] Token (first 50 chars): ${decodedToken.substring(0, 50)}...`);
            } catch (decodeError) {
              // If decode fails, try using raw token
              console.error('[CSRF] Failed to decode token, using raw:', decodeError);
              config.headers['X-XSRF-TOKEN'] = csrfToken;
              config.headers['X-CSRF-TOKEN'] = csrfToken;
              updateCsrfTokenInDefaults();
            }
          } else {
            console.error(`[CSRF] ❌ XSRF-TOKEN cookie NOT FOUND for ${method} ${config.url}`);
            console.error(`[CSRF] Current cookies:`, document.cookie);
            debugCsrfStatus();
          }
        }
      }
    }

    // Log request with headers for debugging (always log CSRF-related info)
    if (config.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
      const headersToLog: Record<string, string> = {};
      const cookieToken = getCsrfToken();
      
      if (config.headers) {
        if (config.headers['X-XSRF-TOKEN']) {
          const headerToken = config.headers['X-XSRF-TOKEN'] as string;
          headersToLog['X-XSRF-TOKEN'] = headerToken.substring(0, 50) + '... (length: ' + headerToken.length + ')';
          
          // Verify token matches cookie
          if (cookieToken) {
            try {
              const decodedCookieToken = decodeURIComponent(cookieToken);
              if (headerToken === decodedCookieToken) {
                headersToLog['Token match'] = '✅ Header matches cookie';
              } else {
                headersToLog['Token match'] = '❌ MISMATCH! Header and cookie differ!';
                console.error('[CSRF] ❌ CRITICAL: Token in header does not match token in cookie!');
                console.error('[CSRF] Header token (first 50):', headerToken.substring(0, 50));
                console.error('[CSRF] Cookie token (first 50):', decodedCookieToken.substring(0, 50));
              }
            } catch (e) {
              headersToLog['Token match'] = '⚠️ Could not verify';
            }
          }
        } else {
          headersToLog['X-XSRF-TOKEN'] = '❌ MISSING!';
        }
        if (config.headers['X-CSRF-TOKEN']) {
          headersToLog['X-CSRF-TOKEN'] = 'present';
        }
        if (config.headers['Authorization']) {
          headersToLog['Authorization'] = 'Bearer ***';
        }
      }
      
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: headersToLog,
        withCredentials: config.withCredentials,
        cookieAvailable: cookieToken ? '✅ Yes' : '❌ No',
        cookieValue: cookieToken ? cookieToken.substring(0, 50) + '...' : 'none',
      });
    }

    // Log request
    logger.logRequest(config.method?.toUpperCase() || 'GET', config.url || '', config.data);

    return config;
  },
  (error) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for success logging and error handling with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response
    logger.logResponse(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      response.data
    );

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    // Log error
    errorHandler.log(error, 'API Response');

    // Handle network errors specifically
    if (!error.response) {
      // Check if we should retry
      if (shouldRetry(error, config)) {
        return retryRequest(config);
      }

      // Network error - no response from server
      const networkError: ApiError = {
        message: 'Network Error: Unable to connect to server. Please check your internet connection.',
        errors: undefined,
      };
      return Promise.reject(networkError);
    }

    // Handle common error cases
    const status = error.response.status;

    // CSRF Token Mismatch (419) - this is a backend issue
    // Frontend sends correct token (matches cookie), but server rejects it
    if (status === 419 && !Capacitor.isNativePlatform()) {
      const cookieToken = getCsrfToken();
      const headerToken = config.headers?.['X-XSRF-TOKEN'] as string | undefined;
      
      console.error('[CSRF Error 419] ❌ CSRF Token Mismatch - BACKEND ISSUE');
      console.error('[CSRF Error 419] Frontend sent:');
      console.error('[CSRF Error 419] - Cookie XSRF-TOKEN:', cookieToken ? cookieToken.substring(0, 50) + '...' : 'MISSING');
      console.error('[CSRF Error 419] - Header X-XSRF-TOKEN:', headerToken ? headerToken.substring(0, 50) + '...' : 'MISSING');
      console.error('[CSRF Error 419] - Tokens match:', cookieToken && headerToken ? 
        (decodeURIComponent(cookieToken) === headerToken ? '✅ YES' : '❌ NO') : 'N/A');
      console.error('[CSRF Error 419]');
      console.error('[CSRF Error 419] ⚠️ This is a BACKEND configuration issue:');
      console.error('[CSRF Error 419] 1. Check Laravel Sanctum middleware configuration');
      console.error('[CSRF Error 419] 2. Check session configuration (domain, same_site, secure)');
      console.error('[CSRF Error 419] 3. Check if CSRF token is being read correctly from cookie');
      console.error('[CSRF Error 419] 4. Check if session is properly initialized');
      
      debugCsrfStatus();
      
      // Don't retry - if token is correct, retrying won't help
      // The issue is on the backend side
      const apiError: ApiError = {
        message: 'CSRF token validation failed on server. Please check backend configuration.',
        errors: undefined,
      };
      return Promise.reject(apiError);
    }

    // Unauthorized - clear token and redirect to login
    if (status === 401) {
      localStorage.removeItem('authToken');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Check if we should retry (for 5xx errors)
    if (status >= 500 && shouldRetry(error, config)) {
      return retryRequest(config);
    }

    // Transform error response to consistent format
    const responseData = error.response?.data as any;
    const apiError: ApiError = {
      message: responseData?.message || error.message || 'An error occurred',
      errors: responseData?.errors,
    };

    return Promise.reject(apiError);
  }
);

/**
 * Check if request should be retried
 */
function shouldRetry(error: AxiosError, config?: RetryConfig): boolean {
  if (!config) return false;

  const retryCount = config._retryCount || 0;
  const maxRetries = appConfig.maxRetries;

  // Don't retry if already retried max times
  if (retryCount >= maxRetries) {
    return false;
  }

  // Don't retry for /workouts/active endpoint - 500/404 means no active workout
  const url = config.url || '';
  if (url.includes('/workouts/active') || url.includes('workout/active')) {
    return false;
  }

  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors
  const status = error.response.status;
  if (status >= 500 && status < 600) {
    return true;
  }

  return false;
}

/**
 * Retry failed request with exponential backoff
 */
async function retryRequest(config: RetryConfig): Promise<AxiosResponse> {
  config._retryCount = (config._retryCount || 0) + 1;

  // Exponential backoff
  const delay = appConfig.retryDelay * Math.pow(2, config._retryCount - 1);

  logger.info(`Retrying request (attempt ${config._retryCount}/${appConfig.maxRetries}) after ${delay}ms`);

  await new Promise(resolve => setTimeout(resolve, delay));

  return apiClient.request(config);
}

export default apiClient;

// Export debug function for console access
if (typeof window !== 'undefined') {
  (window as any).debugCsrf = debugCsrfStatus;
  console.log('[CSRF Debug] Use window.debugCsrf() in console to check CSRF status');
}

// Statistics API methods
export const statisticsApi = {
  // Get time analytics
  getTimeAnalytics: async (): Promise<TimeAnalyticsResponse> => {
    const response = await apiClient.get<TimeAnalyticsResponse>('/user/time-analytics');
    return response.data;
  },

  // Get personal records
  getRecords: async (): Promise<RecordsResponse> => {
    const response = await apiClient.get<RecordsResponse>('/user/records');
    return response.data;
  },

  // Get exercise statistics (progression etc.)
  getExerciseStatistics: async (): Promise<any> => {
    const response = await apiClient.get('/user/exercise-statistics');
    return response.data;
  },

  // Get metrics with pagination
  getMetrics: async (page: number = 1, perPage: number = 50): Promise<MetricsResponse> => {
    const response = await apiClient.get<MetricsResponse>(`/metrics?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Get specific metric by ID
  getMetric: async (metricId: number): Promise<{ data: any; message: string }> => {
    const response = await apiClient.get(`/metrics/${metricId}`);
    return response.data;
  }
};
