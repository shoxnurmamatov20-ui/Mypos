import type { MyPosApiClient } from './client';

export type AuthUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  locale: 'uz' | 'ru' | 'en';
  avatar_url: string | null;
  is_super_admin: boolean;
  roles: string[];
  tenant: AuthTenant | null;
  last_login_at: string | null;
  created_at: string;
};

export type AuthTenant = {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  plan: string;
  status: string;
  default_locale: string;
  default_currency: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
  remember?: boolean;
};

export type LoginResponse = {
  data: {
    token: string;
    user: AuthUser;
  };
};

export type MeResponse = {
  data: AuthUser;
};

export const authApi = {
  login: (client: MyPosApiClient, input: LoginInput) =>
    client.post<LoginResponse>('/api/v1/auth/login', input),

  me: (client: MyPosApiClient) => client.get<MeResponse>('/api/v1/auth/me'),

  logout: (client: MyPosApiClient) =>
    client.post<{ data: { message: string } }>('/api/v1/auth/logout'),
};
