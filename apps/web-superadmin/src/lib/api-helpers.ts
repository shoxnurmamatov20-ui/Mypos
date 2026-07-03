'use client';

import { ApiError } from '@mypos/api-client';
import { MOCK_DASHBOARD_KPIS, MOCK_REVENUE_CHART } from '@/data/mock-dashboard';
import { MOCK_TENANTS } from '@/data/mock-tenants';
import type { DashboardKpis, MockRevenuePoint, TenantSummary } from '@/types/super-admin';
import { apiClient } from './api';

/**
 * Thin wrappers around the `/api/v1/super-admin/*` endpoints.
 *
 * Every dashboard/list helper graceful-falls back to mock fixtures when the
 * backend returns 404/401/403 OR the network is unreachable — so the panel
 * never breaks for an unsigned-in dev visit. Mutations (POST/PATCH/DELETE)
 * intentionally do NOT fall back: callers need to see the real error.
 */

// ─── Envelopes + helpers ──────────────────────────────────────────────────

const isApiUnavailable = (err: unknown): boolean => {
  if (err instanceof ApiError) {
    return err.status === 404 || err.status === 401 || err.status === 403;
  }
  return true; // network error → backend likely offline
};

type Envelope<T> = { data: T };
type Paginated<T> = {
  data: T[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  links?: { first?: string; last?: string; prev?: string; next?: string };
};

// ─── DASHBOARD KPIs + Charts ──────────────────────────────────────────────

type BackendKpis = {
  tenants: {
    total: number;
    active: number;
    trialing: number;
    past_due: number;
    suspended: number;
    cancelled: number;
    growth_30d: number;
  };
  revenue: {
    mrr_total_minor: number;
    arr_total_minor: number;
    average_mrr_minor: number;
    growth_30d_percent: number;
  };
  orders: {
    today_count: number;
    today_revenue_minor: number;
    yesterday_count: number;
    growth_today_percent: number;
    this_month_count: number;
  };
  users: {
    total_customers: number;
    total_employees: number;
    active_today: number;
  };
  system: {
    errors_24h: number;
    avg_response_ms: number;
    uptime_percent: number;
  };
};

type BackendCharts = {
  revenue_by_day: Array<{ date: string; revenue_minor: number }>;
  orders_by_day?: Array<{ date: string; count: number }>;
  signups_by_day?: Array<{ date: string; count: number }>;
  tenants_by_plan?: Array<{ plan: string; count: number }>;
};

function mapBackendKpis(b: BackendKpis): DashboardKpis {
  const tile = (current: number, growthPct: number) => ({
    value: current,
    previous:
      growthPct === 0 || growthPct === -100 ? current : Math.round(current / (1 + growthPct / 100)),
    trend_pct: Number(growthPct.toFixed(2)),
  });

  return {
    mrr_minor: tile(b.revenue.mrr_total_minor, b.revenue.growth_30d_percent),
    active_tenants: tile(b.tenants.active, b.tenants.growth_30d),
    total_orders: tile(b.orders.this_month_count, b.orders.growth_today_percent),
    nrr_pct: tile(b.tenants.active > 0 ? 100 + b.tenants.growth_30d : 100, b.tenants.growth_30d),
    trialing_tenants: b.tenants.trialing,
    at_risk_tenants: b.tenants.past_due + b.tenants.suspended,
  };
}

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  try {
    const res = await apiClient.get<Envelope<BackendKpis>>('/api/v1/super-admin/dashboard');
    return mapBackendKpis(res.data);
  } catch (err) {
    if (isApiUnavailable(err)) return MOCK_DASHBOARD_KPIS;
    throw err;
  }
}

export async function fetchRevenueChart(): Promise<MockRevenuePoint[]> {
  try {
    const res = await apiClient.get<Envelope<BackendCharts>>(
      '/api/v1/super-admin/dashboard/charts',
    );
    const ordersByDay = new Map((res.data.orders_by_day ?? []).map((o) => [o.date, o.count]));
    return res.data.revenue_by_day.map((row) => ({
      date: row.date,
      revenue_minor: row.revenue_minor,
      orders: ordersByDay.get(row.date) ?? 0,
    }));
  } catch (err) {
    if (isApiUnavailable(err)) return MOCK_REVENUE_CHART;
    throw err;
  }
}

// ─── TENANTS — list + CRUD + lifecycle actions ────────────────────────────

export async function fetchTenants(): Promise<TenantSummary[]> {
  try {
    const res = await apiClient.get<Envelope<TenantSummary[]>>('/api/v1/super-admin/tenants');
    return res.data;
  } catch (err) {
    if (isApiUnavailable(err)) return MOCK_TENANTS;
    throw err;
  }
}

export type CreateTenantPayload = {
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  owner_password: string;
  plan?: 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
  trial_days?: number;
  default_locale?: 'uz' | 'ru' | 'en';
  default_currency?: string;
  timezone?: string;
  notes?: string;
};

export async function createTenant(
  payload: CreateTenantPayload,
): Promise<{ tenant: TenantSummary; owner: { id: string; email: string } }> {
  const res = await apiClient.post<
    Envelope<{ tenant: TenantSummary; owner: { id: string; email: string } }>
  >('/api/v1/super-admin/tenants', payload);
  return res.data;
}

export type UpdateTenantPayload = {
  name?: string;
  plan?: string;
  subscription_plan?: string;
  subscription_status?: string;
  mrr_minor?: number;
  subscription_ends_at?: string | null;
  trial_ends_at?: string | null;
  notes?: string | null;
  phone?: string | null;
  email?: string | null;
  default_locale?: 'uz' | 'ru' | 'en';
  default_currency?: string;
};

export async function fetchTenantDetail(
  id: string,
): Promise<TenantSummary & Record<string, unknown>> {
  const res = await apiClient.get<Envelope<TenantSummary & Record<string, unknown>>>(
    `/api/v1/super-admin/tenants/${id}`,
  );
  return res.data;
}

export async function updateTenant(
  id: string,
  payload: UpdateTenantPayload,
): Promise<TenantSummary> {
  const res = await apiClient.patch<Envelope<TenantSummary>>(
    `/api/v1/super-admin/tenants/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteTenant(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/super-admin/tenants/${id}`);
}

export async function suspendTenant(
  id: string,
  payload: { reason: 'non_payment' | 'abuse' | 'other'; notes?: string },
): Promise<TenantSummary> {
  const res = await apiClient.post<Envelope<TenantSummary>>(
    `/api/v1/super-admin/tenants/${id}/suspend`,
    payload,
  );
  return res.data;
}

export async function resumeTenant(id: string): Promise<TenantSummary> {
  const res = await apiClient.post<Envelope<TenantSummary>>(
    `/api/v1/super-admin/tenants/${id}/resume`,
  );
  return res.data;
}

export async function impersonateTenant(id: string): Promise<{
  token: string;
  user: { id: string; email: string; name: string };
  tenant: TenantSummary;
  expires_at: string;
}> {
  const res = await apiClient.post<
    Envelope<{
      token: string;
      user: { id: string; email: string; name: string };
      tenant: TenantSummary;
      expires_at: string;
    }>
  >(`/api/v1/super-admin/tenants/${id}/impersonate`);
  return res.data;
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────

export type AuditLogRecord = {
  id: string;
  tenant_id: string | null;
  actor_user_uuid: string | null;
  actor_type: 'user' | 'super_admin' | 'system' | 'api';
  actor_label: string | null;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  subject_label: string | null;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type AuditLogFilters = {
  per_page?: number;
  page?: number;
  actor?: string;
  action?: string;
  severity?: string;
  tenant_id?: string;
  from?: string; // ISO date
  to?: string;
  search?: string;
};

export async function fetchAuditLogs(
  filters: AuditLogFilters = {},
): Promise<Paginated<AuditLogRecord>> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  const path = `/api/v1/super-admin/audit-logs${qs ? `?${qs}` : ''}`;
  try {
    return await apiClient.get<Paginated<AuditLogRecord>>(path);
  } catch (err) {
    if (isApiUnavailable(err)) return { data: [], meta: { total: 0 } };
    throw err;
  }
}

export async function fetchAuditActions(): Promise<string[]> {
  try {
    const res = await apiClient.get<Envelope<string[]>>('/api/v1/super-admin/audit-logs/actions');
    return res.data;
  } catch (err) {
    if (isApiUnavailable(err)) return [];
    throw err;
  }
}

// ─── ADMINS (team) + INVITATIONS ──────────────────────────────────────────

export type AdminUserRecord = {
  id: string;
  uuid?: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_super_admin: boolean;
  super_admin_role: 'owner' | 'admin' | 'support' | 'finance' | 'developer' | null;
  mfa_enabled: boolean;
  last_super_admin_login_at: string | null;
  last_login_at: string | null;
  created_at: string;
};

export type InvitationRecord = {
  id: string;
  email: string;
  invited_by_user_uuid: string | null;
  accepted_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  metadata: { role?: string; name?: string } | null;
  is_pending: boolean;
  created_at: string;
};

export async function fetchAdmins(): Promise<{
  data: AdminUserRecord[];
  meta?: { total?: number };
}> {
  try {
    return await apiClient.get<{ data: AdminUserRecord[]; meta?: { total?: number } }>(
      '/api/v1/super-admin/admins',
    );
  } catch (err) {
    if (isApiUnavailable(err)) return { data: [] };
    throw err;
  }
}

export async function fetchInvitations(): Promise<{
  data: InvitationRecord[];
  meta?: { total?: number };
}> {
  try {
    return await apiClient.get<{
      data: InvitationRecord[];
      meta?: { total?: number };
    }>('/api/v1/super-admin/admins/invitations');
  } catch (err) {
    if (isApiUnavailable(err)) return { data: [] };
    throw err;
  }
}

export async function inviteAdmin(payload: {
  email: string;
  role?: 'owner' | 'admin' | 'support' | 'finance' | 'developer';
  name?: string;
}): Promise<{ invitation: InvitationRecord; token: string }> {
  const res = await apiClient.post<Envelope<{ invitation: InvitationRecord; token: string }>>(
    '/api/v1/super-admin/admins/invite',
    payload,
  );
  return res.data;
}

export async function revokeAdmin(uuid: string): Promise<void> {
  await apiClient.delete(`/api/v1/super-admin/admins/${uuid}`);
}

// ─── BILLING ──────────────────────────────────────────────────────────────

export type BillingSubscription = {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_status: string;
  mrr_minor: number;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  owner_email?: string;
  created_at: string;
};

export type MrrByPlanRow = {
  plan: string;
  tenants: number;
  mrr_minor: number;
};

export type MrrMovement = {
  new_mrr: number;
  expansion_mrr: number;
  churn_mrr: number;
  net: number;
};

export async function fetchBillingSubscriptions(filters?: {
  status?: string;
  plan?: string;
  per_page?: number;
  page?: number;
}): Promise<Paginated<BillingSubscription>> {
  const params = new URLSearchParams();
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const path = `/api/v1/super-admin/billing/subscriptions${qs ? `?${qs}` : ''}`;
  try {
    return await apiClient.get<Paginated<BillingSubscription>>(path);
  } catch (err) {
    if (isApiUnavailable(err)) return { data: [], meta: { total: 0 } };
    throw err;
  }
}

export async function fetchMrrBreakdown(): Promise<{
  by_plan: MrrByPlanRow[];
  movement_30d: MrrMovement;
}> {
  try {
    const res = await apiClient.get<
      Envelope<{ by_plan: MrrByPlanRow[]; movement_30d: MrrMovement }>
    >('/api/v1/super-admin/billing/mrr-breakdown');
    return res.data;
  } catch (err) {
    if (isApiUnavailable(err)) {
      return {
        by_plan: [],
        movement_30d: { new_mrr: 0, expansion_mrr: 0, churn_mrr: 0, net: 0 },
      };
    }
    throw err;
  }
}

// ─── SETTINGS (platform-wide) ─────────────────────────────────────────────

export type PlatformSettings = {
  feature_flags?: Record<string, boolean>;
  default_plan?: string;
  trial_days?: number;
  default_locale?: string;
  default_currency?: string;
  timezone?: string;
  maintenance_mode?: boolean;
  allow_signups?: boolean;
  // Free-form keys are allowed too
  [key: string]: unknown;
};

export async function fetchSettings(): Promise<PlatformSettings> {
  try {
    const res = await apiClient.get<Envelope<PlatformSettings>>('/api/v1/super-admin/settings');
    return res.data;
  } catch (err) {
    if (isApiUnavailable(err)) return {};
    throw err;
  }
}

export async function updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const res = await apiClient.patch<Envelope<PlatformSettings>>('/api/v1/super-admin/settings', {
    settings: patch,
  });
  return res.data;
}
