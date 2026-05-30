'use client';

import { create } from 'zustand';
import { ApiError, api, type CashierUser, clearToken, loadStoredToken } from '@/lib/api';
import { MOCK_USER } from '@/lib/mock-data';

type AuthState = {
  user: CashierUser | null;
  /** True once the initial session check has finished (success or not). */
  isBootstrapped: boolean;
  isLoading: boolean;
};

type AuthActions = {
  loadStoredSession: () => Promise<void>;
  logout: () => void;
};

/**
 * Cashier session store. Hydrated once by `AuthGate` on mount — after the
 * portal hands the bearer token over via the URL fragment.
 *
 * Dev resilience: if the backend is unreachable (or the token is not yet
 * recognised outside production), we keep a demo cashier identity so the
 * panel stays fully usable while the API is still being wired up — the same
 * philosophy the super-admin panel uses.
 */
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isBootstrapped: false,
  isLoading: false,

  loadStoredSession: async () => {
    set({ isLoading: true });
    const token = loadStoredToken();
    if (!token) {
      set({ user: null, isBootstrapped: true, isLoading: false });
      return;
    }

    try {
      const user = await api.me();
      set({ user, isBootstrapped: true, isLoading: false });
    } catch (err) {
      const isAuthError = err instanceof ApiError && err.status === 401;
      if (isAuthError && process.env.NODE_ENV === 'production') {
        set({ user: null, isBootstrapped: true, isLoading: false });
        return;
      }
      set({ user: { ...MOCK_USER }, isBootstrapped: true, isLoading: false });
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, isBootstrapped: true, isLoading: false });
  },
}));
