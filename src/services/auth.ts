import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  User,
  ApiError,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdateUserNameRequest,
  UpdateUserNameResponse,
} from '@/types/api';
import { errorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { Capacitor } from '@capacitor/core';
import { appConfig } from '../config/app.config';
import axios from 'axios';

const TOKEN_KEY = 'authToken';

export class AuthService {
  // Token management
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Ensure CSRF cookie is set for web platform (stateful authentication)
   * This is required for Laravel Sanctum in web browsers
   */
  static async ensureCsrfCookie(): Promise<void> {
    // Only request CSRF cookie for web platform (not native mobile)
    if (Capacitor.isNativePlatform()) {
      console.log('[CSRF] Native platform - skipping CSRF cookie');
      return;
    }

    try {
      console.log('[CSRF] Requesting CSRF cookie from:', `${appConfig.apiServerUrl}${API_ENDPOINTS.AUTH.CSRF_COOKIE}`);
      
      // CSRF cookie endpoint is on server root, not under /api/v1
      // Use axios directly with server URL (not apiBaseUrl which includes /api/v1)
      const response = await axios.get(`${appConfig.apiServerUrl}${API_ENDPOINTS.AUTH.CSRF_COOKIE}`, {
        withCredentials: true, // Important: must include credentials for cookies
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('[CSRF] CSRF cookie request response:', response.status, response.statusText);
      
      // Wait a bit for cookie to be set by browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify that cookie was set
      const cookies = document.cookie;
      const hasToken = cookies.includes('XSRF-TOKEN');
      
      console.log('[CSRF] All cookies:', cookies || '(no cookies)');
      console.log('[CSRF] XSRF-TOKEN cookie exists:', hasToken);
      
      if (hasToken) {
        // Extract token value for logging (first 20 chars)
        const tokenMatch = cookies.match(/XSRF-TOKEN=([^;]+)/);
        if (tokenMatch) {
          console.log('[CSRF] Token value (first 20 chars):', tokenMatch[1].substring(0, 20) + '...');
        }
        logger.info('CSRF cookie obtained successfully');
      } else {
        console.error('[CSRF] ERROR: Cookie request completed but XSRF-TOKEN cookie not found!');
        console.error('[CSRF] This might be a CORS issue. Check server CORS settings.');
        logger.info('CSRF cookie request completed but cookie not found');
      }
    } catch (error: any) {
      console.error('[CSRF] ERROR: Failed to get CSRF cookie:', error);
      console.error('[CSRF] Response:', error.response?.status, error.response?.statusText);
      console.error('[CSRF] This might indicate:');
      console.error('[CSRF] 1. CORS not configured correctly on server');
      console.error('[CSRF] 2. Server endpoint /sanctum/csrf-cookie not available');
      console.error('[CSRF] 3. Network connectivity issue');
      
      // Log but don't throw - CSRF cookie request failure shouldn't block login
      // Some servers might not require it or might handle it differently
      logger.info('CSRF cookie request failed (may not be required):', error);
    }
  }

  // Authentication methods
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Request CSRF cookie first for web platform (stateful authentication)
      await this.ensureCsrfCookie();

      const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const { token } = response.data;
      
      if (token) {
        this.setToken(token);
      }
      
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Request CSRF cookie first for web platform (stateful authentication)
      await this.ensureCsrfCookie();

      const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.REGISTER, userData);
      const { token, user } = response.data;
      
      if (token) {
        this.setToken(token);
      }
      
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  static async getUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ data: User }>(API_ENDPOINTS.USER.UPDATE);
      return response.data.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Password management methods
  static async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const response = await apiClient.post<ChangePasswordResponse>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data
      );
      logger.info('Password changed successfully');
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'AuthService.changePassword');
      throw error as ApiError;
    }
  }

  static async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'AuthService.forgotPassword');
      throw error as ApiError;
    }
  }

  static async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await apiClient.post<ResetPasswordResponse>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'AuthService.resetPassword');
      throw error as ApiError;
    }
  }

  // User profile methods
  static async updateUserName(data: UpdateUserNameRequest): Promise<UpdateUserNameResponse> {
    try {
      const response = await apiClient.put<UpdateUserNameResponse>(
        API_ENDPOINTS.USER.UPDATE,
        data
      );
      logger.info('User name updated successfully');
      return response.data;
    } catch (error) {
      errorHandler.log(error, 'AuthService.updateUserName');
      throw error as ApiError;
    }
  }
}
