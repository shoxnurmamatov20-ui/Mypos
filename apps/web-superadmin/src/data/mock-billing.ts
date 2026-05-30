/**
 * Mock billing data — derived from `MOCK_TENANTS` for subscriptions and
 * synthesised for the daily MRR-movement chart. Replace with real
 * `/api/v1/super-admin/billing/*` payloads when the backend lands.
 */

import type { TenantPlan, TenantSummary } from '@/types/super-admin';
import { MOCK_TENANTS } from './mock-tenants';

export type MrrMovementPoint = {
  /** ISO yyyy-mm-dd. */
  date: string;
  /** Minor units. */
  new_minor: number;
  expansion_minor: number;
  churn_minor: number;
};

export type MrrSummary = {
  total_mrr_minor: number;
  arr_minor: number;
  active_subscriptions: number;
  trial_conversion_pct: number;
  trial_conversion_trend_pct: number;
  movement_30d: {
    new_minor: number;
    expansion_minor: number;
    churn_minor: number;
    net_minor: number;
  };
};

export type MrrByPlan = {
  plan: TenantPlan;
  count: number;
  mrr_minor: number;
  share_pct: number;
};

export type Invoice = {
  id: string;
  number: string;
  tenant_id: string;
  tenant_name: string;
  amount_minor: number;
  status: 'paid' | 'pending' | 'failed';
  issued_at: string;
  paid_at: string | null;
  due_at: string;
};

const BASE_NOW = new Date('2026-04-25T17:30:00Z').getTime();
const isoDate = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);
const isoTimestamp = (timestamp: number): string =>
  new Date(timestamp).toISOString();

/** Sums every active tenant's MRR — single source of truth for the page. */
const computeTotalMrrMinor = (): number =>
  MOCK_TENANTS.filter((t) => t.status === 'active' || t.status === 'trialing').reduce(
    (acc, t) => acc + t.mrr_minor,
    0,
  );

const TOTAL_MRR_MINOR = computeTotalMrrMinor();

export const MOCK_MRR_SUMMARY: MrrSummary = {
  total_mrr_minor: TOTAL_MRR_MINOR,
  arr_minor: TOTAL_MRR_MINOR * 12,
  active_subscriptions: MOCK_TENANTS.filter(
    (t) => t.status === 'active' || t.status === 'past_due',
  ).length,
  trial_conversion_pct: 62.5,
  trial_conversion_trend_pct: 4.2,
  movement_30d: {
    new_minor: 41_500_000,
    expansion_minor: 18_200_000,
    churn_minor: -12_400_000,
    net_minor: 41_500_000 + 18_200_000 - 12_400_000,
  },
};

/** 30-day daily MRR movement series — small magnitudes, deterministic. */
export const MOCK_MRR_MOVEMENT: MrrMovementPoint[] = Array.from(
  { length: 30 },
  (_, idx) => {
    const day = BASE_NOW - (29 - idx) * 24 * 60 * 60 * 1000;
    // Slight wave around mean. New > expansion > churn most days.
    const newWave = Math.sin(idx / 2.4) * 600_000 + 1_400_000;
    const expansionWave = Math.cos(idx / 3.1) * 300_000 + 700_000;
    const churnWave = Math.sin(idx / 1.9 + 1) * 250_000 + 450_000;

    return {
      date: isoDate(day),
      new_minor: Math.max(200_000, Math.round(newWave + ((idx * 7919) % 7) * 50_000)),
      expansion_minor: Math.max(
        100_000,
        Math.round(expansionWave + ((idx * 3343) % 5) * 30_000),
      ),
      churn_minor: Math.max(
        50_000,
        Math.round(churnWave + ((idx * 2137) % 4) * 25_000),
      ),
    };
  },
);

/** Donut + table breakdown of MRR per plan (only active payers). */
export const MOCK_MRR_BY_PLAN: MrrByPlan[] = (() => {
  const PLAN_ORDER: readonly TenantPlan[] = [
    'enterprise',
    'business',
    'pro',
    'starter',
    'free',
  ];
  const grouped = new Map<TenantPlan, { count: number; mrr_minor: number }>();
  for (const tenant of MOCK_TENANTS) {
    if (tenant.status === 'cancelled' || tenant.status === 'suspended') continue;
    const current = grouped.get(tenant.plan) ?? { count: 0, mrr_minor: 0 };
    current.count += 1;
    current.mrr_minor += tenant.mrr_minor;
    grouped.set(tenant.plan, current);
  }
  const totalMrr = TOTAL_MRR_MINOR || 1;
  return PLAN_ORDER.filter((p) => grouped.has(p)).map((plan) => {
    const stats = grouped.get(plan);
    if (!stats) {
      return { plan, count: 0, mrr_minor: 0, share_pct: 0 };
    }
    return {
      plan,
      count: stats.count,
      mrr_minor: stats.mrr_minor,
      share_pct: Math.round((stats.mrr_minor / totalMrr) * 1000) / 10,
    };
  });
})();

/** Computes the next renewal date — `created_at` + N months from now. */
const nextRenewalIso = (tenant: TenantSummary): string => {
  // Stable derivation: created day-of-month, next future month.
  const created = new Date(tenant.created_at);
  const next = new Date(BASE_NOW);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(created.getUTCDate());
  return next.toISOString();
};

/** Last invoice date for the subscriptions table — pinned per tenant. */
const lastInvoiceIso = (tenant: TenantSummary, idx: number): string => {
  const offsetDays = (idx * 3) % 27;
  const ts = BASE_NOW - offsetDays * 24 * 60 * 60 * 1000;
  return isoTimestamp(ts);
};

export type SubscriptionRow = {
  tenant_id: string;
  tenant_name: string;
  plan: TenantPlan;
  status: TenantSummary['status'];
  mrr_minor: number;
  renews_at: string;
  last_invoice_at: string;
};

export const MOCK_SUBSCRIPTIONS: SubscriptionRow[] = MOCK_TENANTS.map(
  (tenant, idx) => ({
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    mrr_minor: tenant.mrr_minor,
    renews_at: nextRenewalIso(tenant),
    last_invoice_at: lastInvoiceIso(tenant, idx),
  }),
);

/** 20 mock invoices spread across last ~45 days. Statuses mixed. */
export const MOCK_INVOICES: Invoice[] = (() => {
  const result: Invoice[] = [];
  const STATUSES: readonly Invoice['status'][] = [
    'paid',
    'paid',
    'paid',
    'paid',
    'paid',
    'pending',
    'failed',
  ];
  for (let i = 0; i < 20; i += 1) {
    const tenant = MOCK_TENANTS[i % MOCK_TENANTS.length];
    if (!tenant) continue;
    const statusValue = STATUSES[i % STATUSES.length] ?? 'paid';
    const issuedTs = BASE_NOW - i * 2 * 24 * 60 * 60 * 1000;
    const paidTs = statusValue === 'paid' ? issuedTs + 6 * 60 * 60 * 1000 : null;
    const dueTs = issuedTs + 7 * 24 * 60 * 60 * 1000;

    result.push({
      id: `inv-${String(2000 + i).padStart(5, '0')}`,
      number: `INV-2026-${String(2000 + i).padStart(5, '0')}`,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      amount_minor: tenant.mrr_minor || 9_900_000,
      status: statusValue,
      issued_at: isoTimestamp(issuedTs),
      paid_at: paidTs ? isoTimestamp(paidTs) : null,
      due_at: isoTimestamp(dueTs),
    });
  }
  return result;
})();
