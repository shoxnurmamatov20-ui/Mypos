import type { MyPosApiClient } from './client';
import type { CollectionResponse, PaginatedResponse, ResourceResponse } from './menu';

export type Department = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  employees_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateDepartmentInput = {
  name: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
  tenant_id?: string;
};

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export type ListDepartmentsParams = {
  q?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
};

export const departmentsApi = {
  list(client: MyPosApiClient, params: ListDepartmentsParams = {}) {
    const search = new URLSearchParams();
    if (params.q !== undefined) search.set('q', params.q);
    if (params.is_active !== undefined) search.set('is_active', params.is_active ? '1' : '0');
    if (params.per_page !== undefined) search.set('per_page', String(params.per_page));
    if (params.page !== undefined) search.set('page', String(params.page));
    const qs = search.toString();
    return client.get<PaginatedResponse<Department> | CollectionResponse<Department>>(
      `/api/v1/departments${qs ? `?${qs}` : ''}`,
    );
  },

  get(client: MyPosApiClient, id: string) {
    return client.get<ResourceResponse<Department>>(`/api/v1/departments/${id}`);
  },

  create(client: MyPosApiClient, input: CreateDepartmentInput) {
    return client.post<ResourceResponse<Department>>('/api/v1/departments', input);
  },

  update(client: MyPosApiClient, id: string, input: UpdateDepartmentInput) {
    return client.patch<ResourceResponse<Department>>(`/api/v1/departments/${id}`, input);
  },

  delete(client: MyPosApiClient, id: string) {
    return client.delete<{ data: { message: string } }>(`/api/v1/departments/${id}`);
  },
};
