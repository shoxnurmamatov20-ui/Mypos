'use client';

import { ArrowRight, Building2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { TenantSummary } from '@/types/super-admin';

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  active: { color: '#10b981', label: 'Faol' },
  trialing: { color: '#3b82f6', label: 'Sinov' },
  past_due: { color: '#f59e0b', label: 'Kechikdi' },
  suspended: { color: '#ef4444', label: "To'xtatilgan" },
};

const PLAN_STYLE: Record<string, { color: string; label: string }> = {
  free: { color: '#94a3b8', label: 'Free' },
  starter: { color: '#60a5fa', label: 'Starter' },
  pro: { color: '#3b82f6', label: 'Pro' },
  business: { color: '#8b5cf6', label: 'Business' },
  enterprise: { color: '#ec4899', label: 'Enterprise' },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('uz-UZ').format(n);
}

function formatUZS(minor: number): string {
  if (minor >= 1_000_000_000) return `${(minor / 1_000_000_000).toFixed(1)}B so'm`;
  if (minor >= 1_000_000) return `${(minor / 1_000_000).toFixed(1)}M so'm`;
  if (minor >= 1_000) return `${(minor / 1_000).toFixed(0)}K so'm`;
  return `${new Intl.NumberFormat('uz-UZ').format(minor)} so'm`;
}

type Props = {
  tenants: ReadonlyArray<TenantSummary>;
  locale: string;
};

/** Dashboard pulse table — top 8 tenants with avatar / plan / status / orders / revenue. */
export function RecentTenantsTable({ tenants, locale }: Props) {
  const rows = tenants.slice(0, 8);
  const isEmpty = rows.length === 0;

  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[rgba(255,255,255,0.07)] rounded-xl transition-colors">
      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            So&apos;nggi restoranlar
          </h3>
        </div>
        <Link
          href={`/${locale}/tenants` as Route}
          className="inline-flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          Hammasi
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>

      {isEmpty ? (
        <div className="px-4 py-12 text-center">
          <Building2
            className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-700"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tenant yo&apos;q</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Yangi tenant qo&apos;shilganda bu yerda ko&apos;rinadi
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card-list — fits action buttons + status without horizontal scroll */}
          <ul className="md:hidden divide-y divide-gray-50 dark:divide-[rgba(255,255,255,0.06)]">
            {rows.map((tn) => {
              const planStyle = PLAN_STYLE[tn.plan];
              const statusStyle = STATUS_STYLE[tn.status];
              return (
                <li
                  key={tn.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-[#1a2235] transition-colors"
                >
                  <span
                    className="size-9 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    aria-hidden="true"
                  >
                    {tn.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 dark:text-white font-semibold truncate text-[13px]">
                      {tn.name}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs truncate">{tn.slug}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                        style={{
                          background: `${planStyle?.color ?? '#94a3b8'}1a`,
                          color: planStyle?.color ?? '#475569',
                        }}
                      >
                        {planStyle?.label ?? tn.plan}
                      </span>
                      {statusStyle ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-gray-50 dark:bg-[#1a2235] px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ color: statusStyle.color }}
                        >
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ background: statusStyle.color }}
                            aria-hidden="true"
                          />
                          {statusStyle.label}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-900 dark:text-white text-xs font-bold tabular-nums">
                      {formatUZS(tn.total_revenue_minor)}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] tabular-nums">
                      {formatNumber(tn.total_orders_count)} buyurtma
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tablet/Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100 dark:border-[rgba(255,255,255,0.06)] text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-[#1a2235]">
                  <th scope="col" className="px-4 lg:px-6 py-2.5 font-medium">
                    Nomi
                  </th>
                  <th scope="col" className="px-4 lg:px-6 py-2.5 font-medium">
                    Tarif
                  </th>
                  <th scope="col" className="px-4 lg:px-6 py-2.5 font-medium">
                    Holat
                  </th>
                  <th scope="col" className="px-4 lg:px-6 py-2.5 font-medium">
                    Buyurtma
                  </th>
                  <th scope="col" className="px-4 lg:px-6 py-2.5 font-medium hidden lg:table-cell">
                    Daromad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[rgba(255,255,255,0.06)]">
                {rows.map((tn) => {
                  const planStyle = PLAN_STYLE[tn.plan];
                  const statusStyle = STATUS_STYLE[tn.status];
                  return (
                    <tr
                      key={tn.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-[#1a2235] transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-7 rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            aria-hidden="true"
                          >
                            {tn.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-gray-900 dark:text-white font-medium truncate text-xs">
                              {tn.name}
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs truncate">
                              {tn.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                          style={{
                            background: `${planStyle?.color ?? '#94a3b8'}1a`,
                            color: planStyle?.color ?? '#475569',
                          }}
                        >
                          {planStyle?.label ?? tn.plan}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        {statusStyle ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-[#1a2235] px-2 py-0.5 text-[11px] font-medium"
                            style={{ color: statusStyle.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: statusStyle.color }}
                              aria-hidden="true"
                            />
                            {statusStyle.label}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {tn.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-gray-700 dark:text-gray-300 tabular-nums text-xs">
                        {formatNumber(tn.total_orders_count)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell text-xs whitespace-nowrap tabular-nums">
                        {formatUZS(tn.total_revenue_minor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
