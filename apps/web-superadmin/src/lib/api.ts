'use client';

import { MyPosApiClient } from '@mypos/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';
const TOKEN_KEY = 'mypos_super_admin_token';

/**
 * In-memory token cache so the synchronous `getAuthToken` callback
 * stays fast — `localStorage` is the source of truth across reloads
 * and is kept in sync by `storeToken` / `clearToken`.
 */
let inMemoryToken: string | null = null;

export function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
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
