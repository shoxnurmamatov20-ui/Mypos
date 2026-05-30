'use client';

import { useTranslations } from 'next-intl';
import type { TenantStatus } from '@/types/super-admin';

/**
 * Status badge palette. Active variant carries a pulsing dot; the
 * other states are static. Both light + dark variants on every row.
 */
const STATUS_STYLES: Record<TenantStatus, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  trialing:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  past_due:  'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const t = useTranslations('statuses');
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {status === 'active' ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
      ) : null}
      {t(status)}
    </span>
  );
}
