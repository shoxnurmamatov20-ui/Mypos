'use client';

import { cn } from '@/lib/cn';
import type { Invoice } from '@/data/mock-billing';

export type InvoiceStatusFilter = 'all' | Invoice['status'];

export type InvoiceCounts = {
  total: number;
  paid: number;
  pending: number;
  failed: number;
};

export function computeInvoiceCounts(invoices: ReadonlyArray<Invoice>): InvoiceCounts {
  const out: InvoiceCounts = { total: invoices.length, paid: 0, pending: 0, failed: 0 };
  for (const inv of invoices) {
    if (inv.status === 'paid') out.paid++;
    else if (inv.status === 'pending') out.pending++;
    else if (inv.status === 'failed') out.failed++;
  }
  return out;
}

type ChipDef = {
  key: InvoiceStatusFilter;
  label: string;
  count: keyof InvoiceCounts;
  active: string;
};

const CHIPS: ReadonlyArray<ChipDef> = [
  {
    key: 'all',
    label: 'Hammasi',
    count: 'total',
    active:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30',
  },
  {
    key: 'paid',
    label: "To'langan",
    count: 'paid',
    active:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  },
  {
    key: 'pending',
    label: 'Kutilmoqda',
    count: 'pending',
    active:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  },
  {
    key: 'failed',
    label: 'Xato',
    count: 'failed',
    active:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
  },
];

type Props = {
  current: InvoiceStatusFilter;
  onChange: (next: InvoiceStatusFilter) => void;
  counts: InvoiceCounts;
};

/**
 * Status-filter chips for the Recent Invoices section —
 * Hammasi / To'langan / Kutilmoqda / Xato with each count rendered
 * alongside the label. Active chip uses the matching status colour,
 * inactive chips fall back to a neutral surface so the active chip
 * always pops.
 */
export function InvoicesStatusChips({ current, onChange, counts }: Props) {
  return (
    <div
      className="flex gap-1.5 flex-wrap items-center"
      role="tablist"
      aria-label="Hisob-faktura holati"
    >
      {CHIPS.map((c) => {
        const isActive = current === c.key;
        const value = counts[c.count];
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(c.key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-[0.04em] transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              isActive
                ? c.active
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white',
            )}
          >
            <span>{c.label}</span>
            <span
              className={cn(
                'tabular-nums font-extrabold',
                isActive ? '' : 'text-gray-900 dark:text-white',
              )}
            >
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
