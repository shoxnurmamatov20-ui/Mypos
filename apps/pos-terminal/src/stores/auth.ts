import { create } from 'zustand';
import { ApiError, authApi, type AuthUser } from '@mypos/api-client';
import {
  apiClient,
  clearToken,
  loadStoredToken,
  storeToken,
} from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: string | null;
};

type AuthActions = {
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredSession: () => Promise<void>;
  clearError: () => void;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isBootstrapped: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  clearError: () => set({ error: null }),

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(apiClient, { identifier, password });
      const { token, user } = response.data;
      await storeToken(token);
      set({
        user,
        token,
        isLoading: false,
        isBootstrapped: true,
        error: null,
      });
    } catch (err) {
      let message = 'errors.network';
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        message = body?.message ?? 'errors.generic';
      }
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout(apiClient);
    } catch {
      // Swallow server errors — we still clear local state.
    } finally {
      await clearToken();
      set({ ...initialState, isBootstrapped: true, isLoading: false });
    }
  },

  loadStoredSession: async () => {
    set({ isLoading: true });
    try {
      const token = await loadStoredToken();
      if (!token) {
        set({ ...initialState, isBootstrapped: true, isLoading: false });
        return;
      }
      const response = await authApi.me(apiClient);
      set({
        user: response.data,
        token,
        isLoading: false,
        isBootstrapped: true,
        error: null,
      });
    } catch {
      // Token invalid or network error — clear and surface unauthenticated state.
      await clearToken();
      set({ ...initialState, isBootstrapped: true, isLoading: false });
    }
  },
}));
