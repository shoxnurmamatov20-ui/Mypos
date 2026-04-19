import type { MyPosApiClient } from './client';

export type HealthStatus = {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  service: string;
  timestamp: string;
  locale: string;
  timezone: string;
};

export const healthApi = {
  check: (client: MyPosApiClient) => client.get<HealthStatus>('/api/v1/health'),
};
