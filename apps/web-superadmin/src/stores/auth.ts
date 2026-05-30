'use client';

import { ApiError, type AuthUser } from '@mypos/api-client';
import { create } from 'zustand';
import { apiClient, clearToken, loadStoredToken, storeToken } from '@/lib/api';

export type SuperAdminRole = 'owner' | 'admin' | 'support' | 'finance' | 'developer';

export type SuperAdmin = AuthUser & {
  super_admin_role?: SuperAdminRole;
  last_super_admin_login_at?: string | null;
};

type AuthState = {
  user: SuperAdmin | null;
  token: string | null;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: string | null;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredSession: () => Promise<void>;
  clearError: () => void;
};

const DEMO_EMAIL = 'admin@mypos.uz';
const DEMO_PASSWORD = 'superpass123';
const MOCK_TOKEN = 'mock-super-admin-token';

const buildMockUser = (): SuperAdmin => ({
  id: 'mock-1',
  email: DEMO_EMAIL,
  name: 'Demo Super Admin',
  phone: null,
  locale: 'uz',
  avatar_url: null,
  is_super_admin: true,
  roles: ['super-admin'],
  tenant: null,
  last_login_at: new Date().toISOString(),
  created_at: '2025-01-01T00:00:00Z',
  super_admin_role: 'owner',
  last_super_admin_login_at: new Date().toISOString(),
});

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isBootstrapped: false,
  error: null,
};

type LoginResponse = { data: { token: string; user: SuperAdmin } };
type MeResponse = { data: SuperAdmin };

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<LoginResponse>(
        '/api/v1/super-admin/login',
        { email, password },
      );
      const { token, user } = res.data;
      if (!user.is_super_admin) {
        // Backend should have rejected, but defend in depth.
        throw new ApiError('errors.permission_denied', 403, {
          message: 'errors.permission_denied',
        });
      }
      storeToken(token);
      set({ user, token, isLoading: false, isBootstrapped: true, error: null });
    } catch (err) {
      // Dev fallback: when the backend isn't reachable yet, accept the demo
      // credentials locally so the foundation stays usable.
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const mockUser = buildMockUser();
        storeToken(MOCK_TOKEN);
        set({
          user: mockUser,
          token: MOCK_TOKEN,
          isLoading: false,
          isBootstrapped: true,
          error: null,
        });
        return;
      }

      let msg = 'errors.network';
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        if (err.status === 401 || err.status === 422) {
          msg = body?.message ?? 'errors.invalid_credentials';
        } else if (err.status === 403) {
          msg = body?.message ?? 'errors.permission_denied';
        } else {
          msg = body?.message ?? 'errors.generic';
        }
      }
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.post('/api/v1/super-admin/logout');
    } catch {
      // Swallow server errors — local state still gets cleared below.
    }
    clearToken();
    set({ ...initialState, isBootstrapped: true, isLoading: false });
  },

  loadStoredSession: async () => {
    set({ isLoading: true });
    const token = loadStoredToken();
    if (!token) {
      set({ ...initialState, isBootstrapped: true, isLoading: false });
      return;
    }

    // Mock token shortcut — keeps the dev fallback session alive across reloads.
    if (token === MOCK_TOKEN) {
      set({
        user: buildMockUser(),
        token,
        isBootstrapped: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const res = await apiClient.get<MeResponse>('/api/v1/super-admin/me');
      if (!res.data.is_super_admin) {
        clearToken();
        set({ ...initialState, isBootstrapped: true, isLoading: false });
        return;
      }
      set({
        user: res.data,
        token,
        isBootstrapped: true,
        isLoading: false,
        error: null,
      });
    } catch {
      clearToken();
      set({ ...initialState, isBootstrapped: true, isLoading: false });
    }
  },
}));
