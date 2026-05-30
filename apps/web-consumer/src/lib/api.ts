'use client';

import { MyPosApiClient } from '@mypos/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';
const TOKEN_KEY = 'mypos_consumer_auth_token';

/**
 * In-memory token cache so the synchronous `getAuthToken` callback
 * stays fast — `localStorage` is the source of truth across reloads
 * and is kept in sync by `storeToken` / `clearToken`.
 */
let inMemoryToken: string | null = null;

/**
 * SSO handoff: web-portal redirects here with `#token=...&role=...` in the
 * URL hash. localStorage is per-origin, so the portal cannot write our key —
 * consume the hash once, persist it under our own key, then strip it from
 * the URL so the token never leaks into history or the referrer header.
 */
function consumeSsoHandoff(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash;
  if (hash.length <= 1) return;
  const params = new URLSearchParams(hash.slice(1));
  const handoff = params.get('token');
  if (!handoff) return;
  window.localStorage.setItem(TOKEN_KEY, handoff);
  const role = params.get('role');
  if (role) window.localStorage.setItem('mypos_role', role);
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  consumeSsoHandoff();
  const token = window.localStorage.getItem(TOKEN_KEY);
  inMemoryToken = token;
  return token;
}

export function getStoredToken(): string | null {
  return inMemoryToken;
}

export function storeToken(token: string): void {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  inMemoryToken = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export const apiClient = new MyPosApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: () => inMemoryToken,
  onUnauthorized: () => {
    // Token is stale — best-effort clear; the auth store reacts on next render.
    clearToken();
  },
});
