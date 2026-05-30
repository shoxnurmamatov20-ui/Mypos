/**
 * Local types for the super-admin dashboard.
 *
 * Once the Laravel backend exposes `/api/v1/super-admin/*`, these will be
 * replaced by the generated SDK types from `@mypos/api-client/super-admin`.
 * Keep names aligned with the planned schema so the swap is mechanical.
 */

export type TenantPlan = 'free' | 'starter' | 'pro' | 'plus' | 'business' | 'enterprise';

export type TenantStatus = 'active' | 'trialing' | 'past_due' | 'suspended' | 'cancelled';

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  /** Monthly recurring revenue in minor units (tiyin). */
  mrr_minor: number;
  owner_name: string;
  owner_email: string;
  total_orders_count: number;
  /** Lifetime revenue in minor units (tiyin). */
  total_revenue_minor: number;
  last_active_at: string | null;
  suspended_at: string | null;
  created_at: string;
};

export type DashboardKpiTile = {
  /** Current period absolute value (already in display units). */
  value: number;
  /** Previous period absolute value, for delta computation. */
  previous: number;
  /** Trend percent change (server-computed; e.g. 4.2 → +4.2%). */
  trend_pct: number;
};

export type DashboardKpis = {
  /** MRR in minor units (tiyin). */
  mrr_minor: DashboardKpiTile;
  active_tenants: DashboardKpiTile;
  total_orders: DashboardKpiTile;
  /** Net revenue retention as a percent (e.g. 108.4). */
  nrr_pct: DashboardKpiTile;
  /** Tenants currently on trial. */
  trialing_tenants: number;
  /** Tenants past_due / suspended. */
  at_risk_tenants: number;
};

export type MockRevenuePoint = {
  date: string; // ISO yyyy-mm-dd
  /** Revenue in minor units (tiyin). */
  revenue_minor: number;
  /** Active orders processed that day. */
  orders: number;
};

/** Severity of a recent audit-log entry — drives the colour + icon mapping. */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditEntry = {
  id: string;
  /** i18n key suffix (e.g. `tenant_suspended`) — translated client-side. */
  action_key: string;
  /** Human-readable actor (admin) who performed the action. */
  actor: string;
  /** Resource the action touched, usually a tenant name. */
  subject: string;
  severity: AuditSeverity;
  /** ISO timestamp; rendered with `formatDistanceToNow`. */
  created_at: string;
};

/** Single row in the system-health metric grid (label + value + status dot). */
export type SystemHealthMetric = {
  /** i18n key under `dashboard.system_health.*` (e.g. `metric_response`). */
  label_key: string;
  value: string;
  status: 'ok' | 'warn' | 'down';
};

export type SystemHealth = {
  uptime_pct: number;
  metrics: SystemHealthMetric[];
};
