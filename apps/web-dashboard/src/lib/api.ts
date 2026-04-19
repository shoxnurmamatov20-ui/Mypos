import { MyPosApiClient } from '@mypos/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';

const TOKEN_KEY = 'mypos_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export const apiClient = new MyPosApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: () => getStoredToken(),
  onUnauthorized: () => {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/uz/login';
    }
  },
});
