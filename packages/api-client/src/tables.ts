import type { MyPosApiClient } from './client';
import type { CollectionResponse, ResourceResponse, TranslatedString } from './menu';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'disabled';
export type TableShape = 'square' | 'round' | 'rectangle' | 'oval';

export type TableCategory = {
  id: string;
  name: TranslatedString;
  sort_order: number;
  is_active: boolean;
  tables_count?: number;
  created_at: string;
  updated_at: string;
};

export type Table = {
  id: string;
  category_id: string | null;
  category?: TableCategory | null;
  name: string;
  capacity: number;
  status: TableStatus;
  qr_code: string | null;
  position_x: number | null;
  position_y: number | null;
  shape: TableShape;
  created_at: string;
  updated_at: string;
};

export type CreateTableCategoryInput = {
  name: TranslatedString;
  sort_order?: number;
  is_active?: boolean;
};

export type UpdateTableCategoryInput = Partial<CreateTableCategoryInput>;

export type CreateTableInput = {
  category_id?: string | null;
  name: string;
  capacity?: number;
  status?: TableStatus;
  qr_code?: string | null;
  position_x?: number | null;
  position_y?: number | null;
  shape?: TableShape;
};

export type UpdateTableInput = Partial<CreateTableInput>;

export type UpdateTableStatusInput = {
  status: TableStatus;
};

export type ListTablesParams = {
  category_id?: string;
  status?: TableStatus;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const tablesApi = {
  categories: {
    list: (client: MyPosApiClient) =>
      client.get<CollectionResponse<TableCategory>>('/api/v1/tables/categories'),
    create: (client: MyPosApiClient, input: CreateTableCategoryInput) =>
      client.post<ResourceResponse<TableCategory>>('/api/v1/tables/categories', input),
    update: (client: MyPosApiClient, id: string, input: UpdateTableCategoryInput) =>
      client.patch<ResourceResponse<TableCategory>>(`/api/v1/tables/categories/${id}`, input),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/tables/categories/${id}`),
  },
  tables: {
    list: (client: MyPosApiClient, params?: ListTablesParams) => {
      const qs = buildQueryString(params);
      return client.get<CollectionResponse<Table>>(`/api/v1/tables${qs}`);
    },
    show: (client: MyPosApiClient, id: string) =>
      client.get<ResourceResponse<Table>>(`/api/v1/tables/${id}`),
    create: (client: MyPosApiClient, input: CreateTableInput) =>
      client.post<ResourceResponse<Table>>('/api/v1/tables', input),
    update: (client: MyPosApiClient, id: string, input: UpdateTableInput) =>
      client.patch<ResourceResponse<Table>>(`/api/v1/tables/${id}`, input),
    updateStatus: (client: MyPosApiClient, id: string, input: UpdateTableStatusInput) =>
      client.patch<ResourceResponse<Table>>(`/api/v1/tables/${id}/status`, input),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/tables/${id}`),
  },
};
