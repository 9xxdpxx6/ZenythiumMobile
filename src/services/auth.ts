import apiClient from './api';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  User,
  ApiError 
} from '@/types/api';

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

  // Authentication methods
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/api/v1/login', credentials);
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
      const response = await apiClient.post<RegisterResponse>('/api/v1/register', userData);
      const { token } = response.data;
      
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
      await apiClient.post('/api/v1/logout');
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  static async getUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ data: User }>('/api/v1/user');
      return response.data.data;
    } catch (error) {
      throw error as ApiError;
    }
  }
}
