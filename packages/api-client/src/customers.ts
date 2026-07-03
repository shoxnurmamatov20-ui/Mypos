import type { MyPosApiClient } from './client';
import type { PaginatedResponse, ResourceResponse } from './menu';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type LoyaltyAccount = {
  id: string;
  program_id: string;
  tier: LoyaltyTier;
  points_balance: number;
  lifetime_points: number;
};

export type Customer = {
  id: string;
  phone: string;
  email: string | null;
  first_name: string;
  last_name: string | null;
  full_name: string;
  birthday: string | null;
  locale: string;
  gender: string | null;
  avatar_url: string | null;
  tags: string[];
  notes: string | null;
  total_orders: number;
  total_spent: number;
  last_visit_at: string | null;
  loyalty_account?: LoyaltyAccount | null;
  created_at: string;
  updated_at: string;
};

export type CreateCustomerInput = {
  phone: string;
  email?: string | null;
  first_name: string;
  last_name?: string | null;
  birthday?: string | null;
  locale?: 'uz' | 'ru' | 'en';
  gender?: 'male' | 'female' | 'other' | null;
  avatar_url?: string | null;
  tags?: string[];
  notes?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type ListCustomersParams = {
  q?: string;
  tag?: string;
  tier?: LoyaltyTier;
  per_page?: number;
  page?: number;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const customersApi = {
  list: (client: MyPosApiClient, params?: ListCustomersParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<Customer>>(`/api/v1/customers${qs}`);
  },
  show: (client: MyPosApiClient, id: string) =>
    client.get<ResourceResponse<Customer>>(`/api/v1/customers/${id}`),
  create: (client: MyPosApiClient, input: CreateCustomerInput) =>
    client.post<ResourceResponse<Customer>>('/api/v1/customers', input),
  update: (client: MyPosApiClient, id: string, input: UpdateCustomerInput) =>
    client.patch<ResourceResponse<Customer>>(`/api/v1/customers/${id}`, input),
  delete: (client: MyPosApiClient, id: string) =>
    client.delete<{ data: { message: string } }>(`/api/v1/customers/${id}`),
};
