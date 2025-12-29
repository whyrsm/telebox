import { create } from 'zustand';
import { authApi } from '@/lib/api';
import { AxiosError } from 'axios';

interface User {
  id: string;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  storage: {
    fileCount: number;
    totalSize: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const axiosError = error as AxiosError;
      
      // Don't retry on actual auth failures (401)
      if (axiosError.response?.status === 401) {
        throw error;
      }
      
      // Only retry on network errors
      if (axiosError.response) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: (token: string) => {
    localStorage.setItem('token', token);
    set({ isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      // Retry on network errors (server might be restarting)
      const { data } = await retryWithBackoff(() => authApi.me());
      set({ user: data, isLoading: false, isAuthenticated: true });
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Only clear token on actual 401 auth failures
      // Keep token on network errors - user can retry manually
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('token');
        set({ user: null, isLoading: false, isAuthenticated: false });
      } else {
        // Network error - keep token, mark as not loading but preserve auth state
        // User still has token, they can retry
        set({ isLoading: false, isAuthenticated: !!token });
      }
    }
  },
}));
