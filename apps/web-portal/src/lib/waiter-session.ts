'use client';

import { useEffect, useState } from 'react';

/**
 * Waiter panel session.
 *
 * Persisted in `localStorage` by `LoginForm` immediately after a
 * successful `/api/v1/auth/login`. The waiter panel lives in the **same
 * origin** as the login page (web-portal, :3005), so a plain localStorage
 * handover is enough — no cross-origin URL-fragment hack like the other
 * role apps need.
 */
export interface WaiterSession {
  token: string;
  role: string;
  name: string;
  tenantName: string;
  /** Waiter phone number, shown on the account screen when the login persisted it. */
  phone?: string;
}

const KEYS = {
  token: 'mypos_token',
  role: 'mypos_role',
  name: 'mypos_name',
  tenant: 'mypos_tenant',
  phone: 'mypos_phone',
} as const;

/** Read the persisted session. Returns `null` when nothing is stored. */
export function readWaiterSession(): WaiterSession | null {
  if (typeof window === 'undefined') return null;

  const token = window.localStorage.getItem(KEYS.token);
  const role = window.localStorage.getItem(KEYS.role);
  if (!token || !role) return null;

  return {
    token,
    role,
    name: window.localStorage.getItem(KEYS.name) ?? 'Ofitsiant',
    tenantName: window.localStorage.getItem(KEYS.tenant) ?? 'MyPOS',
    phone: window.localStorage.getItem(KEYS.phone) ?? undefined,
  };
}

/** Persist the session after login. */
export function persistWaiterSession(session: WaiterSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEYS.token, session.token);
  window.localStorage.setItem(KEYS.role, session.role);
  window.localStorage.setItem(KEYS.name, session.name);
  window.localStorage.setItem(KEYS.tenant, session.tenantName);
  if (session.phone) window.localStorage.setItem(KEYS.phone, session.phone);
}

/** Wipe every session key — used on logout. */
export function clearWaiterSession(): void {
  if (typeof window === 'undefined') return;
  for (const key of Object.values(KEYS)) {
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem('mypos_redirect');
}

/**
 * Client hook — reads the session once on mount. SSR-safe (returns `null`
 * on the server, then hydrates on the client).
 */
export function useWaiterSession(): WaiterSession | null {
  const [session, setSession] = useState<WaiterSession | null>(null);
  useEffect(() => {
    setSession(readWaiterSession());
  }, []);
  return session;
}
