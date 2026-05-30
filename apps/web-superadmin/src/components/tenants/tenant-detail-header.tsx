'use client';

import { ArrowLeft, MoreHorizontal, Pencil, Shield } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TenantPlanBadge } from './tenant-plan-badge';
import { TenantStatusBadge } from './tenant-status-badge';
import { cn } from '@/lib/cn';
import { pickAvatarColor } from '@/lib/tenant-utils';
import type { TenantSummary } from '@/types/super-admin';

type Props = {
  tenant: TenantSummary;
  locale: string;
  onEdit: () => void;
  onImpersonate: () => void;
  onMore: () => void;
};

/**
 * Tenant detail header — responsive: avatar + name on top, actions
 * stacked below on mobile, beside-the-title from `md:` and up.
 */
export function TenantDetailHeader({
  tenant,
  locale,
  onEdit,
  onImpersonate,
  onMore,
}: Props) {
  const t = useTranslations('tenant_detail');
  const initial = tenant.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="space-y-3 md:space-y-4">
      <Link
        href={`/${locale}/tenants` as Route}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#62716d] dark:text-[#94a3b8] transition-colors hover:text-[#16221f] dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120] rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{t('back')}</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <div
            className={cn(
              'flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl text-lg md:text-xl font-extrabold text-white',
              pickAvatarColor(tenant.slug),
            )}
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl md:text-3xl font-extrabold text-[#16221f] dark:text-white leading-tight tracking-tight">
              {tenant.name}
            </h1>
            <div className="mt-1.5 md:mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs md:text-sm text-[#62716d] dark:text-[#94a3b8] font-mono">
                {tenant.slug}
              </span>
              <TenantPlanBadge plan={tenant.plan} />
              <TenantStatusBadge status={tenant.status} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'inline-flex h-10 flex-1 md:flex-none items-center justify-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors active:scale-95',
              'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
              'bg-white dark:bg-[#111827] text-[#16221f] dark:text-white',
              'hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
            )}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span>{t('edit')}</span>
          </button>
          <button
            type="button"
            onClick={onImpersonate}
            className={cn(
              'inline-flex h-10 flex-1 md:flex-none items-center justify-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors active:scale-95',
              'border-amber-300 dark:border-amber-500/40',
              'bg-amber-50 dark:bg-amber-500/10 text-[#b7791f] dark:text-amber-300',
              'hover:bg-amber-100 dark:hover:bg-amber-500/20',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
            )}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>{t('impersonate')}</span>
          </button>
          <button
            type="button"
            onClick={onMore}
            aria-label={t('more')}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors active:scale-95',
              'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
              'bg-white dark:bg-[#111827] text-[#62716d] dark:text-[#94a3b8]',
              'hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
            )}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
