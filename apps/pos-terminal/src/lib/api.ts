import * as SecureStore from 'expo-secure-store';
import { MyPosApiClient } from '@mypos/api-client';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:58000';

const TOKEN_KEY = 'mypos_auth_token';

// In-memory cache so the synchronous `getAuthToken` hook can return
// the latest token without an `await` on every request. It is kept
// in sync by `storeToken` / `clearToken` / `loadStoredToken`.
let inMemoryToken: string | null = null;

export async function loadStoredToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  inMemoryToken = token;
  return token;
}

export function getStoredToken(): string | null {
  return inMemoryToken;
}

export async function storeToken(token: string): Promise<void> {
  inMemoryToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  inMemoryToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const apiClient = new MyPosApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: () => inMemoryToken,
  onUnauthorized: () => {
    // Token is stale — best-effort clear. The auth store watches
    // this state and will redirect to /login on next render tick.
    void clearToken();
  },
});
