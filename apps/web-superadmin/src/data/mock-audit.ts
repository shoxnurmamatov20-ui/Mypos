/**
 * Synthetic audit-log dataset used until the backend exposes
 * `/api/v1/super-admin/audit`. Entries are deterministic — they use a
 * pinned `BASE_NOW` timestamp and explicit minute offsets so the table
 * always shows the same data on every render. Rendering with
 * `formatDistanceToNow` keeps the relative labels evergreen.
 */

import type { TenantSummary } from '@/types/super-admin';
import { MOCK_TENANTS } from './mock-tenants';

export type AuditActorType = 'user' | 'super_admin' | 'system' | 'api';
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditLog = {
  id: string;
  tenant_id: string | null;
  tenant_name: string | null;
  actor_user_uuid: string | null;
  actor_label: string | null;
  actor_type: AuditActorType;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  subject_label: string | null;
  severity: AuditSeverity;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Pinned "now" — keeps timestamps stable across renders for snapshot
 * tests and demo screenshots. The relative labels keep updating because
 * `formatDistanceToNow` compares against the current clock at render.
 */
const BASE_NOW = new Date('2026-04-25T17:30:00Z').getTime();

const isoMinutesAgo = (minutes: number): string =>
  new Date(BASE_NOW - minutes * 60_000).toISOString();

const SUPER_ADMINS = [
  { uuid: 'sa-1', label: 'Akbar Rasulov', email: 'akbar@mypos.uz' },
  { uuid: 'sa-2', label: 'Dilshod Karimov', email: 'dilshod@mypos.uz' },
  { uuid: 'sa-3', label: 'Bobur Yusupov', email: 'bobur@mypos.uz' },
  { uuid: 'sa-4', label: 'Nigora Saidova', email: 'nigora@mypos.uz' },
] as const;

const TENANT_USERS = [
  { uuid: 'tu-1', label: 'Cashier #4 (Osh Markazi)' },
  { uuid: 'tu-2', label: 'Manager Aziza' },
  { uuid: 'tu-3', label: 'Owner Sherzod' },
  { uuid: 'tu-4', label: 'Cashier #2 (Sushi Toshkent)' },
] as const;

const IPS = [
  '85.221.32.18',
  '94.158.40.213',
  '213.230.65.94',
  '195.158.4.222',
  '178.218.225.71',
  '212.42.119.6',
] as const;

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
  'MyPosPOS/1.4.2 iOS/17.4 (iPad)',
  'MyPosKDS/1.0.8 ChromeOS/121',
] as const;

const pickTenant = (idx: number): TenantSummary => {
  const tenant = MOCK_TENANTS[idx % MOCK_TENANTS.length];
  if (!tenant) throw new Error('MOCK_TENANTS unexpectedly empty');
  return tenant;
};

const pickAdmin = (idx: number): (typeof SUPER_ADMINS)[number] => {
  const admin = SUPER_ADMINS[idx % SUPER_ADMINS.length];
  if (!admin) throw new Error('SUPER_ADMINS unexpectedly empty');
  return admin;
};

const pickUser = (idx: number): (typeof TENANT_USERS)[number] => {
  const user = TENANT_USERS[idx % TENANT_USERS.length];
  if (!user) throw new Error('TENANT_USERS unexpectedly empty');
  return user;
};

const pickIp = (idx: number): string => {
  const ip = IPS[idx % IPS.length];
  return ip ?? '0.0.0.0';
};

const pickUa = (idx: number): string => {
  const ua = USER_AGENTS[idx % USER_AGENTS.length];
  return ua ?? 'Unknown UA';
};

type Spec = {
  action: string;
  severity: AuditSeverity;
  subject_type: string | null;
  actor_type: AuditActorType;
  metadata?: Record<string, unknown>;
};

/** Action specs cycled through to build the synthetic feed. */
const SPECS: readonly Spec[] = [
  {
    action: 'super_admin.login',
    severity: 'info',
    subject_type: 'super_admin',
    actor_type: 'super_admin',
    metadata: { mfa_used: true },
  },
  {
    action: 'tenant.created',
    severity: 'info',
    subject_type: 'tenant',
    actor_type: 'super_admin',
    metadata: { plan: 'starter', trial_days: 14 },
  },
  {
    action: 'tenant.suspended',
    severity: 'warning',
    subject_type: 'tenant',
    actor_type: 'super_admin',
    metadata: { reason: 'past_due_invoices', invoices_unpaid: 2 },
  },
  {
    action: 'tenant.resumed',
    severity: 'info',
    subject_type: 'tenant',
    actor_type: 'super_admin',
    metadata: { reason: 'manual_reactivation' },
  },
  {
    action: 'tenant.impersonated',
    severity: 'critical',
    subject_type: 'tenant',
    actor_type: 'super_admin',
    metadata: { duration_minutes: 18, ticket: 'SUP-1284' },
  },
  {
    action: 'super_admin.invitation_created',
    severity: 'info',
    subject_type: 'super_admin_invitation',
    actor_type: 'super_admin',
    metadata: { role: 'support' },
  },
  {
    action: 'super_admin.role_changed',
    severity: 'warning',
    subject_type: 'super_admin',
    actor_type: 'super_admin',
    metadata: { from: 'support', to: 'finance' },
  },
  {
    action: 'staff.pin_login_failed',
    severity: 'warning',
    subject_type: 'staff',
    actor_type: 'user',
    metadata: { attempts: 3, locked: false },
  },
  {
    action: 'staff.pin_login',
    severity: 'info',
    subject_type: 'staff',
    actor_type: 'user',
    metadata: { device: 'POS-12' },
  },
  {
    action: 'order.created',
    severity: 'info',
    subject_type: 'order',
    actor_type: 'user',
    metadata: { items: 4, total_minor: 18_500_000 },
  },
  {
    action: 'payment.captured',
    severity: 'info',
    subject_type: 'payment',
    actor_type: 'system',
    metadata: { provider: 'click', amount_minor: 18_500_000 },
  },
  {
    action: 'payment.failed',
    severity: 'error',
    subject_type: 'payment',
    actor_type: 'system',
    metadata: { provider: 'payme', code: 'INSUFFICIENT_FUNDS' },
  },
  {
    action: 'system.high_error_rate',
    severity: 'critical',
    subject_type: 'system',
    actor_type: 'system',
    metadata: { service: 'orders-api', error_rate_pct: 4.2, threshold_pct: 1.0 },
  },
  {
    action: 'tenant.plan_upgraded',
    severity: 'info',
    subject_type: 'tenant',
    actor_type: 'user',
    metadata: { from: 'pro', to: 'business' },
  },
  {
    action: 'super_admin.logout',
    severity: 'info',
    subject_type: 'super_admin',
    actor_type: 'super_admin',
  },
] as const;

const SPEC_COUNT = SPECS.length;

const pickSpec = (idx: number): Spec => {
  const spec = SPECS[idx % SPEC_COUNT];
  if (!spec) throw new Error('SPECS unexpectedly empty');
  return spec;
};

const buildEntry = (idx: number, minutesAgo: number): AuditLog => {
  const spec = pickSpec(idx);
  const tenant = pickTenant(idx);
  const admin = pickAdmin(idx);
  const user = pickUser(idx);

  let actor_user_uuid: string | null = null;
  let actor_label: string | null = null;

  switch (spec.actor_type) {
    case 'super_admin':
      actor_user_uuid = admin.uuid;
      actor_label = `${admin.label} <${admin.email}>`;
      break;
    case 'user':
      actor_user_uuid = user.uuid;
      actor_label = user.label;
      break;
    case 'system':
      actor_user_uuid = null;
      actor_label = 'System';
      break;
    case 'api':
      actor_user_uuid = null;
      actor_label = 'API client';
      break;
  }

  let subject_id: string | null = null;
  let subject_label: string | null = null;

  if (spec.subject_type === 'tenant') {
    subject_id = tenant.id;
    subject_label = tenant.name;
  } else if (spec.subject_type === 'super_admin') {
    subject_id = admin.uuid;
    subject_label = admin.email;
  } else if (spec.subject_type === 'super_admin_invitation') {
    subject_id = `inv-${idx}`;
    subject_label = `support+${idx}@mypos.uz`;
  } else if (spec.subject_type === 'staff') {
    subject_id = user.uuid;
    subject_label = user.label;
  } else if (spec.subject_type === 'order') {
    subject_id = `ord-${10_000 + idx}`;
    subject_label = `Order #${10_000 + idx}`;
  } else if (spec.subject_type === 'payment') {
    subject_id = `pay-${20_000 + idx}`;
    subject_label = `Payment #${20_000 + idx}`;
  } else if (spec.subject_type === 'system') {
    subject_id = null;
    subject_label = 'orders-api';
  }

  const tenant_id = spec.subject_type === 'system' ? null : tenant.id;
  const tenant_name = spec.subject_type === 'system' ? null : tenant.name;
  const metadata = spec.metadata ?? null;

  return {
    id: `aud-${String(idx).padStart(4, '0')}`,
    tenant_id,
    tenant_name,
    actor_user_uuid,
    actor_label,
    actor_type: spec.actor_type,
    action: spec.action,
    subject_type: spec.subject_type,
    subject_id,
    subject_label,
    severity: spec.severity,
    ip_address: spec.actor_type === 'system' ? null : pickIp(idx),
    user_agent: spec.actor_type === 'system' ? null : pickUa(idx),
    metadata,
    created_at: isoMinutesAgo(minutesAgo),
  };
};

/** Generates 60 deterministic audit log entries spread across 7 days. */
export function generateMockAuditLogs(): AuditLog[] {
  const total = 60;
  const entries: AuditLog[] = [];
  // Spread across last 7 days = 7 * 24 * 60 = 10 080 minutes.
  // Use an exponential-ish curve so most events are recent.
  for (let i = 0; i < total; i += 1) {
    const minutes = Math.round((i + 1) ** 1.6 * 4);
    entries.push(buildEntry(i, minutes));
  }
  return entries;
}

export const MOCK_AUDIT_LOGS: AuditLog[] = generateMockAuditLogs();
