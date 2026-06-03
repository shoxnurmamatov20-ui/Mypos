import type { MyPosApiClient } from './client';
import type { PaginatedResponse, ResourceResponse } from './menu';

export type UnitType = 'weight' | 'volume' | 'count' | 'length';

export type UnitOfMeasure = {
  id: string;
  name: string;
  abbreviation: string;
  type: UnitType;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateUnitInput = {
  name: string;
  abbreviation: string;
  type: UnitType;
  is_active?: boolean;
  sort_order?: number;
};

export type UpdateUnitInput = Partial<CreateUnitInput>;

export type ListUnitsParams = {
  q?: string;
  active_only?: boolean;
  per_page?: number;
  page?: number;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}`;
};

export const unitsApi = {
  list: (client: MyPosApiClient, params?: ListUnitsParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<UnitOfMeasure>>(`/api/v1/units${qs}`);
  },
  show: (client: MyPosApiClient, id: string) =>
    client.get<ResourceResponse<UnitOfMeasure>>(`/api/v1/units/${id}`),
  create: (client: MyPosApiClient, input: CreateUnitInput) =>
    client.post<ResourceResponse<UnitOfMeasure>>('/api/v1/units', input),
  update: (client: MyPosApiClient, id: string, input: UpdateUnitInput) =>
    client.patch<ResourceResponse<UnitOfMeasure>>(`/api/v1/units/${id}`, input),
  delete: (client: MyPosApiClient, id: string) =>
    client.delete<{ data: { message: string } }>(`/api/v1/units/${id}`),
};
