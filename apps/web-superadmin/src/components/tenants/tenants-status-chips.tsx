'use client';

import { cn } from '@/lib/cn';
import type { TenantSummary } from '@/types/super-admin';

/**
 * Synthetic "health" classifier for tenants — mirrors ShifoReyting
 * `kritik / diqqat / soglom` health states but expressed in MyPOS
 * terms: at-risk (past_due + suspended), trialing, active.
 */
export type TenantHealth = 'all' | 'kritik' | 'diqqat' | 'soglom';

export type TenantHealthCounts = {
  total: number;
  kritik: number;
  diqqat: number;
  soglom: number;
  /** Tenants that have no owner email/name — surfaced as a side metric. */
  no_owner: number;
  /** Distinct plan tier count — "X tarif qamrab olingan" metric. */
  distinct_plans: number;
  /** Active subscriptions total — "Y faol obuna" companion metric. */
  active_subscriptions: number;
};

export function computeHealthCounts(tenants: ReadonlyArray<TenantSummary>): TenantHealthCounts {
  const out: TenantHealthCounts = {
    total: tenants.length,
    kritik: 0,
    diqqat: 0,
    soglom: 0,
    no_owner: 0,
    distinct_plans: 0,
    active_subscriptions: 0,
  };
  const plans = new Set<string>();
  for (const t of tenants) {
    if (t.status === 'past_due' || t.status === 'suspended') out.kritik++;
    else if (t.status === 'trialing') out.diqqat++;
    else if (t.status === 'active') {
      out.soglom++;
      out.active_subscriptions++;
    }
    if (!t.owner_email && !t.owner_name) out.no_owner++;
    plans.add(t.plan);
  }
  out.distinct_plans = plans.size;
  return out;
}

export function filterByHealth(
  tenants: ReadonlyArray<TenantSummary>,
  health: TenantHealth,
): ReadonlyArray<TenantSummary> {
  if (health === 'all') return tenants;
  if (health === 'kritik') {
    return tenants.filter((t) => t.status === 'past_due' || t.status === 'suspended');
  }
  if (health === 'diqqat') return tenants.filter((t) => t.status === 'trialing');
  return tenants.filter((t) => t.status === 'active');
}

type ChipDef = {
  key: TenantHealth;
  label: string;
  count: keyof TenantHealthCounts | 'total';
  /** Active-state classes — picked when the chip is selected. */
  active: string;
};

const CHIPS: ReadonlyArray<ChipDef> = [
  {
    key: 'all',
    label: 'Jami',
    count: 'total',
    active:
      'bg-[rgba(15,118,110,0.10)] text-[#0f766e] border-[rgba(15,118,110,0.25)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[#14b8a6] dark:border-[rgba(20,184,166,0.30)]',
  },
  {
    key: 'kritik',
    label: 'Kritik',
    count: 'kritik',
    active:
      'bg-[rgba(239,68,68,0.10)] text-[#b42318] border-[rgba(239,68,68,0.30)] dark:bg-[rgba(239,68,68,0.18)] dark:text-[#f87171] dark:border-[rgba(239,68,68,0.40)]',
  },
  {
    key: 'diqqat',
    label: 'Diqqat',
    count: 'diqqat',
    active:
      'bg-[rgba(245,158,11,0.10)] text-[#b7791f] border-[rgba(245,158,11,0.30)] dark:bg-[rgba(245,158,11,0.18)] dark:text-[#fbbf24] dark:border-[rgba(245,158,11,0.40)]',
  },
  {
    key: 'soglom',
    label: "Sog'lom",
    count: 'soglom',
    active:
      'bg-[rgba(34,197,94,0.10)] text-[#18794e] border-[rgba(34,197,94,0.30)] dark:bg-[rgba(34,197,94,0.18)] dark:text-[#22c55e] dark:border-[rgba(34,197,94,0.40)]',
  },
];

type Props = {
  current: TenantHealth;
  onChange: (next: TenantHealth) => void;
  counts: TenantHealthCounts;
};

/** himoya `.orgm-chips` row — 4 status pills + side metadata. */
export function TenantsStatusChips({ current, onChange, counts }: Props) {
  return (
    <div
      className="flex gap-1.5 flex-wrap flex-1 min-w-0 items-center"
      role="group"
      aria-label="Tenant holatlari bo'yicha filtr"
    >
      {CHIPS.map((c) => {
        const isActive = current === c.key;
        const value = counts[c.count];
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-[0.04em] transition-colors active:scale-95',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]',
              isActive
                ? c.active
                : 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#62716d] dark:text-[#94a3b8] border-transparent hover:bg-white dark:hover:bg-[#111827]',
            )}
          >
            {c.label}
            <span
              className={cn(
                'tabular-nums font-extrabold',
                isActive ? '' : 'text-[#16221f] dark:text-white',
              )}
            >
              {value}
            </span>
          </button>
        );
      })}

      {/* Secondary metadata — hidden on phones, surfaces from sm+. */}
      <span
        className="hidden sm:inline text-[#62716d] dark:text-[#94a3b8] text-[11px] font-bold px-1.5 select-none"
        aria-hidden="true"
      >
        ·
      </span>
      <span className="hidden sm:inline text-[#62716d] dark:text-[#94a3b8] text-[11px] font-bold">
        <span className="text-[#b7791f] dark:text-[#fbbf24] font-extrabold tabular-nums">
          {counts.no_owner}
        </span>{' '}
        egasiz
      </span>
      <span
        className="hidden lg:inline text-[#62716d] dark:text-[#94a3b8] text-[11px] font-bold px-1.5 select-none"
        aria-hidden="true"
      >
        ·
      </span>
      <span className="hidden lg:inline text-[#62716d] dark:text-[#94a3b8] text-[11px] font-bold">
        <span className="text-[#16221f] dark:text-white font-extrabold tabular-nums">
          {counts.distinct_plans}
        </span>{' '}
        tarif ·{' '}
        <span className="text-[#16221f] dark:text-white font-extrabold tabular-nums">
          {counts.active_subscriptions}
        </span>{' '}
        faol obuna
      </span>
    </div>
  );
}
