'use client';

import { create } from 'zustand';
import { clearSession, getStoredRole, loadStoredToken } from '@/lib/api';

/**
 * CEO session store. The universal portal (`apps/web-portal`, port 3005)
 * owns the actual login flow and hands a Sanctum token over via the URL
 * fragment — see `AuthGate`. This store only mirrors that token into
 * memory so `ProtectedRoute`, the sidebar and the topbar can react to it.
 *
 * Unlike the super-admin store there is no `/me` round-trip here: the CEO
 * data endpoints (`/api/v1/ceo/*`) already answer 401/403 when the token
 * is stale, and the page clients bounce to the portal on that. Keeping the
 * store token-only means the panel never hard-fails on a missing endpoint.
 */
export type CeoUser = {
  /** Display name — derived from the SSO role until a profile endpoint exists. */
  name: string;
  /** Raw role string handed over by the portal (e.g. `owner`, `director`). */
  role: string;
};

type AuthState = {
  user: CeoUser | null;
  token: string | null;
  isBootstrapped: boolean;
};

type AuthActions = {
  loadStoredSession: () => void;
  logout: () => void;
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Egasi',
  ceo: 'CEO',
  director: 'Direktor',
  manager: 'Menejer',
};

function roleToName(role: string | null): string {
  if (!role) return 'CEO';
  return ROLE_LABELS[role.toLowerCase()] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  isBootstrapped: false,

  loadStoredSession: () => {
    const token = loadStoredToken();
    if (!token) {
      set({ user: null, token: null, isBootstrapped: true });
      return;
    }
    const role = getStoredRole();
    set({
      user: { name: roleToName(role), role: role ?? 'ceo' },
      token,
      isBootstrapped: true,
    });
  },

  logout: () => {
    clearSession();
    set({ user: null, token: null, isBootstrapped: true });
  },
}));
