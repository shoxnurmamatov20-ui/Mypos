'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import type { Route } from 'next';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlanBadge, StatusBadge } from '@/components/dashboard/badges';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { SubscriptionRow } from '@/data/mock-billing';
import { formatNumber, formatUZS } from '@/lib/format';
import type { TenantPlan, TenantStatus } from '@/types/super-admin';

type StatusFilter = TenantStatus | 'all';
type PlanFilter = TenantPlan | 'all';

type Props = {
  rows: SubscriptionRow[];
  /** When `true`, hide filters + Renews/Last-invoice columns, cap rows at 6. */
  compact?: boolean;
  /** Controlled filters + pagination — billing-view drives the query. */
  statusFilter?: StatusFilter;
  planFilter?: PlanFilter;
  onStatusChange?: (next: StatusFilter) => void;
  onPlanChange?: (next: PlanFilter) => void;
  page?: number;
  lastPage?: number;
  total?: number;
  onPageChange?: (next: number) => void;
  isLoading?: boolean;
};

const STATUS_OPTIONS: readonly StatusFilter[] = [
  'all',
  'active',
  'trialing',
  'past_due',
  'suspended',
  'cancelled',
];
const PLAN_OPTIONS: readonly PlanFilter[] = [
  'all',
  'free',
  'starter',
  'pro',
  'business',
  'enterprise',
];

/**
 * Filterable subscriptions table. Status + plan native selects sit in
 * the card header, rows are clickable and route to the tenant detail
 * page.
 *
 * Two modes:
 *   - `compact`: rendered inline on the billing landing — filters and
 *     extra columns removed, rows capped at 6.
 *   - default: full filterable + paginated table.
 *
 * On mobile (<sm) extra columns hide one-by-one and the filters stack
 * full-width. The table itself keeps `min-w-[640px]` and lives inside
 * an `overflow-x-auto` wrapper so the user can scroll sideways without
 * the whole page bouncing.
 */
export function SubscriptionsTable({
  rows,
  compact = false,
  statusFilter = 'all',
  planFilter = 'all',
  onStatusChange,
  onPlanChange,
  page = 1,
  lastPage = 1,
  total,
  onPageChange,
  isLoading = false,
}: Props) {
  const t = useTranslations('billing');
  const tPlan = useTranslations('plans');
  const tStatus = useTranslations('statuses');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  const list = compact ? rows.slice(0, 6) : rows;
  const hasActiveFilters = statusFilter !== 'all' || planFilter !== 'all';

  const goToTenant = (tenantId: string) => {
    router.push(`/${locale}/tenants/${tenantId}` as Route);
  };

  const clearFilters = () => {
    onStatusChange?.('all');
    onPlanChange?.('all');
  };

  const fieldClass = cn(
    'h-9 w-full md:w-auto pl-3 pr-8 rounded-md border text-xs font-semibold cursor-pointer transition-colors duration-150',
    'border-gray-200 bg-white text-gray-900',
    'dark:border-gray-700 dark:bg-gray-900 dark:text-white',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    'hover:border-teal-500 dark:hover:border-teal-400',
  );

  return (
    <Card className="p-4 md:p-5">
      <CardHeader className="mb-4 flex-col md:flex-row gap-3 items-start md:items-center">
        <CardTitle hint={t('subscriptions_subtitle')}>
          {t('subscriptions_title')}
        </CardTitle>
        {!compact ? (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:ml-auto">
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange?.(event.target.value as StatusFilter)}
              className={fieldClass}
              aria-label={t('subscriptions_filter_all_status')}
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? t('subscriptions_filter_all_status') : tStatus(value)}
                </option>
              ))}
            </select>
            <select
              value={planFilter}
              onChange={(event) => onPlanChange?.(event.target.value as PlanFilter)}
              className={fieldClass}
              aria-label={t('subscriptions_filter_all_plans')}
            >
              {PLAN_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? t('subscriptions_filter_all_plans') : tPlan(value)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </CardHeader>

      {/* No negative margin — extending past the card padding would
          push the page into horizontal scroll on mobile. The table
          (min-w-[760px]) scrolls inside this container instead. */}
      <div className="relative overflow-x-auto">
        {isLoading ? (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px]"
            role="status"
            aria-label="Yuklanmoqda"
          >
            <Loader2
              className="h-5 w-5 animate-spin text-teal-700 dark:text-teal-400"
              aria-hidden="true"
            />
          </div>
        ) : null}
        <table
          className={cn(
            'w-full text-sm',
            compact ? 'min-w-[520px]' : 'min-w-[760px]',
          )}
        >
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
              <th className="px-4 md:px-5 py-2.5">Tenant</th>
              <th className="px-3 py-2.5">{t('mrr_table_plan')}</th>
              <th className="px-3 py-2.5 hidden sm:table-cell">Holat</th>
              <th className="px-3 py-2.5 text-right">{t('mrr_table_mrr')}</th>
              {compact ? null : (
                <>
                  <th className="px-3 py-2.5 hidden md:table-cell">
                    {t('subscriptions_renews')}
                  </th>
                  <th className="px-4 md:px-5 py-2.5 hidden lg:table-cell">
                    {t('subscriptions_last_invoice')}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {list.length === 0 ? (
              <tr>
                <td colSpan={compact ? 4 : 6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                      aria-hidden="true"
                    >
                      <Inbox className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {hasActiveFilters
                        ? "Filtrlarga mos obunalar yo'q"
                        : t('no_subscriptions')}
                    </p>
                    {hasActiveFilters && !compact ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline focus:outline-none focus-visible:underline"
                      >
                        Filtrlarni tozalash
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              list.map((row) => (
                <tr
                  key={row.tenant_id}
                  onClick={() => goToTenant(row.tenant_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToTenant(row.tenant_id);
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`${row.tenant_name} — ${tPlan(row.plan)}, ${formatUZS(row.mrr_minor)}`}
                  className="cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60 focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-gray-800/60"
                >
                  <td className="px-4 md:px-5 py-3 font-semibold text-gray-900 dark:text-white truncate max-w-[160px] md:max-w-[220px]">
                    {row.tenant_name}
                  </td>
                  <td className="px-3 py-3">
                    <PlanBadge plan={row.plan} label={tPlan(row.plan)} />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <StatusBadge status={row.status} label={tStatus(row.status)} />
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">
                    {formatUZS(row.mrr_minor)}
                  </td>
                  {compact ? null : (
                    <>
                      <td className="px-3 py-3 hidden md:table-cell text-gray-500 dark:text-gray-400 tabular-nums">
                        {safeDate(row.renews_at)}
                      </td>
                      <td className="px-4 md:px-5 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400 tabular-nums">
                        {safeDate(row.last_invoice_at)}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!compact && onPageChange && lastPage > 1 ? (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
            {total !== undefined ? `${formatNumber(total)} ta · ` : ''}
            Sahifa {formatNumber(page)} / {formatNumber(lastPage)}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="inline-flex h-8 items-center gap-1 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Oldingi</span>
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(lastPage, page + 1))}
              disabled={page >= lastPage}
              className="inline-flex h-8 items-center gap-1 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              aria-label="Keyingi sahifa"
            >
              <span className="hidden sm:inline">Keyingi</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** Best-effort date formatter — backend may send ISO date or full timestamp. */
function safeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd.MM.yyyy');
  } catch {
    return '—';
  }
}
