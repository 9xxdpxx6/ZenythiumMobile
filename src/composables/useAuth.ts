import { ref, computed } from 'vue';
import { AuthService } from '@/services/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  User, 
  ApiError 
} from '@/types/api';

export function useAuth() {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => AuthService.isAuthenticated());

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    
    try {
      await AuthService.login(credentials);
      await fetchUser();
      return true;
    } catch (err) {
      error.value = (err as ApiError).message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.register(userData);
      
      // If user data is in response, use it immediately
      if (response.user) {
        user.value = response.user;
      } else {
        // Otherwise fetch it
        await fetchUser();
      }
      
      return true;
    } catch (err) {
      error.value = (err as ApiError).message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      await AuthService.logout();
      user.value = null;
    } catch (err) {
      error.value = (err as ApiError).message;
    } finally {
      loading.value = false;
    }
  };

  const fetchUser = async (): Promise<void> => {
    if (!isAuthenticated.value) {
      user.value = null;
      return;
    }

    try {
      user.value = await AuthService.getUser();
    } catch (err) {
      console.error('Failed to fetch user:', err);
      user.value = null;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    clearError,
  };
}
