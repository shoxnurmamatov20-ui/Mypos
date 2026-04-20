import { MyPosApiClient } from '@mypos/api-client';
import { config } from './config.js';

/**
 * Thin wrapper around `MyPosApiClient`.
 *
 * The bot uses a single service-account Sanctum token (`MYPOS_API_TOKEN`) —
 * every call is authenticated as the "bot" user. The backend still scopes
 * data by tenant, so `MYPOS_TENANT_SLUG` is passed per-request where the
 * public endpoints need it.
 */
let client: MyPosApiClient | null = null;

export function apiClient(): MyPosApiClient {
  if (client !== null) return client;
  const cfg = config();
  client = new MyPosApiClient({
    baseUrl: cfg.MYPOS_API_URL,
    getAuthToken: () => cfg.MYPOS_API_TOKEN ?? null,
    onUnauthorized: () => {
      console.error('MyPOS API returned 401 — check MYPOS_API_TOKEN.');
    },
  });
  return client;
}

export function tenantSlug(): string {
  return config().MYPOS_TENANT_SLUG;
}
