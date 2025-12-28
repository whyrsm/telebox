import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

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
      const { data } = await authApi.me();
      set({ user: data, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },
}));
