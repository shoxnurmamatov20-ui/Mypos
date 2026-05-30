'use client';

import { format } from 'date-fns';
import { Download, Inbox, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatUZS } from '@/lib/format';
import type { Invoice } from '@/data/mock-billing';
import {
  computeInvoiceCounts,
  InvoicesStatusChips,
  type InvoiceStatusFilter,
} from './invoices-status-chips';

type Props = {
  invoices: Invoice[];
};

const STATUS_STYLES: Record<Invoice['status'], string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
  pending: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  failed: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
};

const RANGE_OPTIONS = [
  { key: 'all', label: 'Davr: hammasi' },
  { key: '7d', label: "So'nggi 7 kun" },
  { key: '30d', label: "So'nggi 30 kun" },
  { key: '90d', label: "So'nggi 90 kun" },
] as const;
type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

const RANGE_DAYS: Record<RangeKey, number | null> = {
  all: null,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/**
 * Recent invoices section. Two stacked filter strips above a paginated
 * table:
 *   1. Status chips + total amount metadata + export.
 *   2. Search + date-range select + clear button.
 *   3. Table — sortable visually with right-aligned amount + status
 *      pill + download chip.
 *
 * Columns hide progressively on smaller breakpoints; the whole table
 * lives inside an `overflow-x-auto` wrapper so users can scroll
 * sideways instead of breaking the page layout.
 */
export function InvoicesTable({ invoices }: Props) {
  const t = useTranslations('billing');

  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [range, setRange] = useState<RangeKey>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => computeInvoiceCounts(invoices), [invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const days = RANGE_DAYS[range];
    const cutoff = days === null ? 0 : Date.now() - days * 86_400_000;
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (days !== null && new Date(inv.issued_at).getTime() < cutoff) return false;
      if (q && !`${inv.number} ${inv.tenant_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [invoices, statusFilter, range, query]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, inv) => s + inv.amount_minor, 0),
    [filtered],
  );

  const hasActiveFilters =
    statusFilter !== 'all' || range !== 'all' || query.length > 0;

  const onClear = () => {
    setStatusFilter('all');
    setRange('all');
    setQuery('');
  };

  const fieldClass = cn(
    'h-9 pl-3 pr-8 rounded-md border text-xs font-semibold cursor-pointer transition-colors duration-150',
    'border-gray-200 bg-white text-gray-900',
    'dark:border-gray-700 dark:bg-gray-900 dark:text-white',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    'hover:border-teal-500 dark:hover:border-teal-400',
  );

  return (
    <div className="space-y-3">
      {/* Header bar — chips + total amount + export */}
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <InvoicesStatusChips
          current={statusFilter}
          onChange={setStatusFilter}
          counts={counts}
        />
        <span
          className="hidden sm:inline text-gray-400 dark:text-gray-600 text-xs font-bold px-1 select-none"
          aria-hidden="true"
        >
          ·
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          jami{' '}
          <span className="text-gray-900 dark:text-white font-extrabold tabular-nums">
            {formatUZS(totalAmount)}
          </span>
        </span>
        <span className="flex-1 hidden sm:block" />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          <Download className="w-3 h-3" strokeWidth={2.2} aria-hidden="true" />
          Eksport
        </button>
      </div>

      {/* Filters — search + range + clear */}
      <div className="flex items-stretch gap-2 flex-wrap px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidiruv: tenant nomi, schyot raqami..."
            autoComplete="off"
            aria-label="Qidirish"
            className={cn(
              'h-9 w-full pl-9 pr-3 rounded-md border text-xs font-medium transition-colors duration-150',
              'border-gray-200 bg-white text-gray-900 placeholder:text-gray-500',
              'dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            )}
          />
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          className={fieldClass}
          aria-label="Davr filtri"
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className={cn(
            'h-9 px-3 rounded-md border bg-transparent text-gray-500 dark:text-gray-400 text-xs font-semibold transition-colors duration-150',
            'border-gray-200 dark:border-gray-700',
            'hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
          )}
        >
          Tozalash
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-3 hidden md:table-cell text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  {t('invoice_th_date')}
                </th>
                <th className="px-4 py-3 hidden sm:table-cell text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  {t('invoice_th_number')}
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  {t('invoice_th_tenant')}
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  {t('invoice_th_amount')}
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  {t('invoice_th_status')}
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  <span className="sr-only">{t('invoice_th_action')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                        aria-hidden="true"
                      >
                        <Inbox className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Hech narsa topilmadi
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={onClear}
                          className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline focus:outline-none focus-visible:underline"
                        >
                          Filtrlarni tozalash
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 hidden md:table-cell tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {format(new Date(invoice.issued_at), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-[11px] text-gray-700 dark:text-gray-300">
                      {invoice.number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                      {invoice.tenant_name}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">
                      {formatUZS(invoice.amount_minor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]',
                          STATUS_STYLES[invoice.status],
                        )}
                      >
                        {t(`invoice_status_${invoice.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`${t('invoice_download')} ${invoice.number}`}
                        title={t('invoice_download')}
                        className="inline-grid place-items-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                      >
                        <Download className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
