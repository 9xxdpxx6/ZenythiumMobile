import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, TimeAnalyticsResponse, RecordsResponse, MetricsResponse } from '@/types/api';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api-zenythium.ru/',
  // baseURL: 'http://localhost:8000/',
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Additional configuration for mobile apps
  validateStatus: (status) => {
    return status >= 200 && status < 300; // default
  },
});

// Request interceptor to add authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle network errors specifically
    if (!error.response) {
      // Network error - no response from server
      const networkError: ApiError = {
        message: 'Network Error: Unable to connect to server. Please check your internet connection.',
        errors: undefined,
      };
      return Promise.reject(networkError);
    }
    
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Transform error response to consistent format
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      errors: error.response?.data?.errors,
    };
    
    return Promise.reject(apiError);
  }
);

export default apiClient;

// Statistics API methods
export const statisticsApi = {
  // Get time analytics
  getTimeAnalytics: async (): Promise<TimeAnalyticsResponse> => {
    const response = await apiClient.get<TimeAnalyticsResponse>('/api/v1/user/time-analytics');
    return response.data;
  },

  // Get personal records
  getRecords: async (): Promise<RecordsResponse> => {
    const response = await apiClient.get<RecordsResponse>('/api/v1/user/records');
    return response.data; // Возвращаем response.data, который содержит { data: {...}, message: "..." }
  },

  // Get metrics with pagination
  getMetrics: async (page: number = 1, perPage: number = 50): Promise<MetricsResponse> => {
    const response = await apiClient.get<MetricsResponse>(`/api/v1/metrics?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Get specific metric by ID
  getMetric: async (metricId: number): Promise<{ data: any; message: string }> => {
    const response = await apiClient.get(`/api/v1/metrics/${metricId}`);
    return response.data;
  }
};
