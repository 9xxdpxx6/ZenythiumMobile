import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError, TimeAnalyticsResponse, RecordsResponse, MetricsResponse } from '@/types/api';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/error-handler';
import { Capacitor } from '@capacitor/core';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthService } from './auth';

/**
 * Enhanced API Client with interceptors, retry logic, and error transformation
 */

const baseURL = appConfig.apiBaseUrl;

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
  _isRefreshing?: boolean; // Track if this request is waiting for token refresh
}

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

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
      return null;
    }

    // Method 1: Direct regex match (most reliable)
    const regex = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`);
    const match = cookies.match(regex);
    
    if (match && match[1]) {
      const token = match[1].trim();
      if (token) {
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
          return token;
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.info('Error reading CSRF token from cookie:', error);
    return null;
  }
}

/**
 * Debug function to check CSRF token and cookie status (dev only)
 */
function debugCsrfStatus(): void {
  if (Capacitor.isNativePlatform() || !import.meta.env.DEV) {
    return;
  }

  const cookies = document.cookie;
  const csrfToken = getCsrfToken();
  
  console.group('[CSRF Debug]');
  console.log('XSRF-TOKEN cookie exists:', cookies.includes('XSRF-TOKEN'));
  console.log('CSRF token extracted:', csrfToken ? 'Yes' : 'No');
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
        if (!config.headers || !config.headers['X-XSRF-TOKEN']) {
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
            } catch (decodeError) {
              // If decode fails, try using raw token
              config.headers['X-XSRF-TOKEN'] = csrfToken;
              config.headers['X-CSRF-TOKEN'] = csrfToken;
              updateCsrfTokenInDefaults();
            }
          } else if (import.meta.env.DEV) {
            console.warn(`[CSRF] XSRF-TOKEN cookie not found for ${method} ${config.url}`);
            debugCsrfStatus();
          }
        }
      }
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

    // CSRF Token Mismatch (419)
    if (status === 419 && !Capacitor.isNativePlatform()) {
      if (import.meta.env.DEV) {
        console.error('[CSRF Error 419] CSRF token mismatch');
        debugCsrfStatus();
      }
      
      const apiError: ApiError = {
        message: 'CSRF token validation failed. Please refresh the page and try again.',
        errors: undefined,
      };
      return Promise.reject(apiError);
    }

    // Unauthorized - try to refresh token
    if (status === 401 && !config._retry) {
      // Skip refresh for refresh endpoint itself to avoid infinite loop
      if (config.url?.includes('/refresh') || config.url?.endsWith(API_ENDPOINTS.AUTH.REFRESH)) {
        // Refresh failed, clear token and redirect to login
        AuthService.clearToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        const apiError: ApiError = {
          message: 'Session expired. Please login again.',
          errors: undefined,
        };
        return Promise.reject(apiError);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string | null) => {
              if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient.request(config));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      return AuthService.refreshToken()
        .then(newToken => {
          if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient.request(config);
        })
        .catch(refreshError => {
          processQueue(refreshError, null);
          AuthService.clearToken();
          // Redirect to login only if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
        });
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

// Export debug function for console access (dev only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugCsrf = debugCsrfStatus;
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
