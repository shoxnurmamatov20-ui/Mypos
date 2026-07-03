'use client';

import { ApiError, type AuthUser, authApi } from '@mypos/api-client';
import { create } from 'zustand';
import { apiClient, clearToken, getStoredToken } from '@/lib/api';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoaded: boolean;
  load: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isLoaded: false,

  load: async () => {
    if (get().isLoading) return;
    const token = getStoredToken();
    if (!token) {
      set({ user: null, isLoading: false, isLoaded: true });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await authApi.me(apiClient);
      set({ user: response.data, isLoading: false, isLoaded: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
      }
      set({ user: null, isLoading: false, isLoaded: true });
    }
  },

  logout: async () => {
    try {
      await authApi.logout(apiClient);
    } catch {
      // ignore - just clear local state
    }
    clearToken();
    set({ user: null, isLoaded: true, isLoading: false });
  },

  reset: () => set({ user: null, isLoading: false, isLoaded: false }),
}));
