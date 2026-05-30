'use client';

import { ApiError, type AuthUser, authApi, customersApi } from '@mypos/api-client';
import { create } from 'zustand';
import { apiClient, clearToken, loadStoredToken, storeToken } from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: string | null;
};

export type RegisterInput = {
  firstName: string;
  phone: string;
  password: string;
  locale?: 'uz' | 'ru' | 'en';
};

/**
 * Distinguishes the "no public registration endpoint yet" case from
 * a generic auth failure. Pages can catch this to show the
 * "use the mobile app" fallback instead of an opaque error.
 */
export class RegistrationUnavailableError extends Error {
  constructor() {
    super('registration_unavailable');
    this.name = 'RegistrationUnavailableError';
  }
}

type AuthActions = {
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
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

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  clearError: () => set({ error: null }),

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(apiClient, { identifier, password });
      const { token, user } = res.data;
      storeToken(token);
      set({
        user,
        token,
        isLoading: false,
        isBootstrapped: true,
        error: null,
      });
    } catch (err) {
      let msg = 'errors.network';
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        msg = body?.message ?? 'errors.generic';
      }
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  register: async (input) => {
    set({ isLoading: true, error: null });
    try {
      // Self-registration is currently routed through the customers create
      // endpoint. Until a dedicated public `/auth/register` exists, this call
      // may be rejected for unauthenticated requests — that's the trigger
      // for the "use mobile app" fallback in the page.
      await customersApi.create(apiClient, {
        first_name: input.firstName,
        phone: input.phone,
        locale: input.locale ?? 'uz',
      });
      // Customer created — log them in to obtain a session token.
      await get().login(input.phone, input.password);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) {
        set({ isLoading: false, error: 'auth.register_failed_use_mobile' });
        throw new RegistrationUnavailableError();
      }
      let msg = 'errors.network';
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        msg = body?.message ?? 'errors.generic';
      }
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout(apiClient);
    } catch {
      // Swallow server errors — local state still gets cleared below.
    }
    clearToken();
    set({ ...initialState, isBootstrapped: true, isLoading: false });
  },

  loadStoredSession: async () => {
    set({ isLoading: true });
    try {
      const token = loadStoredToken();
      if (!token) {
        set({ ...initialState, isBootstrapped: true, isLoading: false });
        return;
      }
      const res = await authApi.me(apiClient);
      set({
        user: res.data,
        token,
        isLoading: false,
        isBootstrapped: true,
        error: null,
      });
    } catch {
      clearToken();
      set({ ...initialState, isBootstrapped: true, isLoading: false });
    }
  },
}));
