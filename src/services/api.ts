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

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiBaseUrl,
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

    // Try to find the cookie
    const value = `; ${cookies}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const token = parts.pop()?.split(';').shift();
      if (token) {
        return token;
      }
    }
    
    // Also try without the semicolon prefix (in case cookie is at the start)
    const directMatch = cookies.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (directMatch) {
      return directMatch[1];
    }
    
    return null;
  } catch (error) {
    logger.info('Error reading CSRF token from cookie:', error);
    return null;
  }
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
    // Only for state-changing methods (POST, PUT, DELETE, PATCH)
    if (!Capacitor.isNativePlatform()) {
      const method = config.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken && config.headers) {
          const decodedToken = decodeURIComponent(csrfToken);
          // Laravel Sanctum expects X-XSRF-TOKEN header (from XSRF-TOKEN cookie)
          config.headers['X-XSRF-TOKEN'] = decodedToken;
          // Some Laravel versions also accept X-CSRF-TOKEN
          config.headers['X-CSRF-TOKEN'] = decodedToken;
          logger.info(`CSRF token added to ${method} request`);
        } else {
          logger.info(`CSRF token not found for ${method} request`);
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

    // CSRF Token Mismatch (419) - request CSRF cookie again for web platform
    if (status === 419 && !Capacitor.isNativePlatform()) {
      try {
        // Try to get CSRF cookie again
        await axios.get(`${appConfig.apiServerUrl}${API_ENDPOINTS.AUTH.CSRF_COOKIE}`, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        // Retry the original request if it's a retryable method
        const method = config.method?.toUpperCase();
        if (config && method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          // Update CSRF token in headers
          const csrfToken = getCsrfToken();
          if (csrfToken && config.headers) {
            const decodedToken = decodeURIComponent(csrfToken);
            config.headers['X-XSRF-TOKEN'] = decodedToken;
            config.headers['X-CSRF-TOKEN'] = decodedToken;
          }
          // Retry the request
          return apiClient.request(config);
        }
      } catch (csrfError) {
        logger.info('Failed to refresh CSRF cookie:', csrfError);
      }
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
