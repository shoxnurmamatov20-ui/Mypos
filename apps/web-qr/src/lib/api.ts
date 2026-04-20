import { MyPosApiClient } from '@mypos/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';

/**
 * Singleton public API client for the QR-menu PWA.
 *
 * No auth token is sent — all endpoints used here live under `/api/v1/public/*`.
 */
export const apiClient = new MyPosApiClient({ baseUrl });
