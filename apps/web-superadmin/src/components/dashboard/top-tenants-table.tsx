'use client';

import { formatDistanceToNow } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { formatNumber, formatUZS } from '@/lib/format';
import type { TenantPlan, TenantStatus, TenantSummary } from '@/types/super-admin';
import { PlanBadge, StatusBadge } from './badges';

type TopTenantsTableProps = {
  tenants: TenantSummary[];
  locale: string;
};

const LOCALE_MAP = { uz, ru, en: enUS } as const;

export function TopTenantsTable({ tenants, locale }: TopTenantsTableProps) {
  const t = useTranslations('dashboard.top_tenants');
  const tPlans = useTranslations('dashboard.tenant_plans');
  const tStatuses = useTranslations('dashboard.tenant_statuses');

  const dfLocale = LOCALE_MAP[locale as keyof typeof LOCALE_MAP] ?? uz;

  const rows = useMemo(
    () =>
      [...tenants]
        .sort((a, b) => b.mrr_minor - a.mrr_minor || b.total_orders_count - a.total_orders_count)
        .slice(0, 10),
    [tenants],
  );

  const tenantsHref = `/${locale}/tenants` as Route;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle hint={t('subtitle')}>{t('title')}</CardTitle>
        <Link
          href={tenantsHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#0f766e] dark:text-[#14b8a6] transition-colors hover:text-[#0b5e57] dark:hover:text-[#2dd4bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          {t('see_all')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardHeader>

      {/* No negative margin — `-mx-5` pushed the table beyond the card
          edges and caused the whole page to grow a horizontal scroll on
          phones. `overflow-x-auto` + the table's `min-w-[640px]` is
          enough: the scroll lives inside the card, not the viewport. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-left text-xs font-semibold uppercase tracking-wide text-[#62716d] dark:text-[#94a3b8]">
              <th scope="col" className="px-5 py-3">{t('th_tenant')}</th>
              <th scope="col" className="px-3 py-3">{t('th_plan')}</th>
              <th scope="col" className="px-3 py-3">{t('th_status')}</th>
              <th scope="col" className="px-3 py-3 text-right">{t('th_mrr')}</th>
              <th scope="col" className="px-3 py-3 text-right">{t('th_orders')}</th>
              <th scope="col" className="px-5 py-3 text-right">{t('th_last_active')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tenant, idx) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                isLast={idx === rows.length - 1}
                locale={locale}
                dfLocale={dfLocale}
                planLabel={tPlans(tenant.plan as TenantPlan)}
                statusLabel={tStatuses(tenant.status as TenantStatus)}
                neverActiveLabel={t('never_active')}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type TenantRowProps = {
  tenant: TenantSummary;
  isLast: boolean;
  locale: string;
  dfLocale: typeof uz;
  planLabel: string;
  statusLabel: string;
  neverActiveLabel: string;
};

function TenantRow({
  tenant,
  isLast,
  locale,
  dfLocale,
  planLabel,
  statusLabel,
  neverActiveLabel,
}: TenantRowProps) {
  const lastActive = tenant.last_active_at
    ? formatDistanceToNow(new Date(tenant.last_active_at), {
        addSuffix: true,
        locale: dfLocale,
      })
    : neverActiveLabel;

  const initial = tenant.name.charAt(0).toUpperCase();
  const tenantHref = `/${locale}/tenants/${tenant.id}` as Route;

  return (
    <tr
      className={cn(
        'group transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
        !isLast && 'border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]',
      )}
    >
      <td className="px-5 py-3">
        <Link
          href={tenantHref}
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e]/20 to-blue-500/20 dark:from-[#14b8a6]/30 dark:to-blue-500/30 text-sm font-bold text-[#0f766e] dark:text-[#14b8a6] ring-1 ring-inset ring-[rgba(22,34,31,0.09)] dark:ring-[rgba(255,255,255,0.07)]"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[#16221f] dark:text-white group-hover:text-[#0f766e] dark:group-hover:text-[#14b8a6]">
              {tenant.name}
            </span>
            <span className="block truncate text-xs text-[#62716d] dark:text-[#94a3b8]">
              @{tenant.slug}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-3">
        <PlanBadge plan={tenant.plan} label={planLabel} />
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={tenant.status} label={statusLabel} />
      </td>
      <td className="px-3 py-3 text-right font-bold tabular-nums text-[#16221f] dark:text-white">
        {tenant.mrr_minor > 0 ? formatUZS(tenant.mrr_minor) : '—'}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-[#16221f] dark:text-gray-300">
        {formatNumber(tenant.total_orders_count)}
      </td>
      <td className="px-5 py-3 text-right text-xs text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap">
        {lastActive}
      </td>
    </tr>
  );
}
