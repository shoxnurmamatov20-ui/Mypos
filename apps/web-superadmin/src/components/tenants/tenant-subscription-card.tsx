'use client';

import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUZS } from '@/lib/format';
import type { TenantSummary } from '@/types/super-admin';
import { TenantPlanBadge } from './tenant-plan-badge';
import { TenantStatusBadge } from './tenant-status-badge';

type Props = {
  tenant: TenantSummary;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  notes: string;
  onEdit: () => void;
  locale: string;
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function TenantSubscriptionCard({
  tenant,
  trialEndsAt,
  subscriptionEndsAt,
  notes,
  onEdit,
  locale,
}: Props) {
  const t = useTranslations('tenant_detail');

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: t('subscription_plan'),
      value: <TenantPlanBadge plan={tenant.plan} />,
    },
    {
      label: t('subscription_status'),
      value: <TenantStatusBadge status={tenant.status} />,
    },
    {
      label: t('subscription_trial_ends'),
      value: (
        <span className="text-[#16221f] dark:text-gray-200 tabular-nums">
          {formatDate(trialEndsAt, locale)}
        </span>
      ),
    },
    {
      label: t('subscription_ends'),
      value: (
        <span className="text-[#16221f] dark:text-gray-200 tabular-nums">
          {formatDate(subscriptionEndsAt, locale)}
        </span>
      ),
    },
    {
      label: t('subscription_mrr'),
      value: (
        <span className="text-[#16221f] dark:text-white font-bold tabular-nums">
          {tenant.mrr_minor > 0 ? formatUZS(tenant.mrr_minor) : '—'}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
        <CardTitle>{t('subscription_title')}</CardTitle>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-3 text-xs font-semibold text-[#16221f] dark:text-gray-200 transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#0f766e] dark:hover:text-[#14b8a6] w-full sm:w-auto sm:ml-auto justify-center active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('edit_subscription')}</span>
        </button>
      </CardHeader>

      <dl className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3 text-sm">
            <dt className="text-[#62716d] dark:text-[#94a3b8]">{row.label}</dt>
            <dd className="text-right font-medium">{row.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-1 py-3 text-sm">
          <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('subscription_notes')}</dt>
          <dd
            className={
              notes
                ? 'text-[#16221f] dark:text-gray-200 leading-relaxed'
                : 'text-[#62716d]/70 dark:text-[#94a3b8]/70 italic'
            }
          >
            {notes || t('subscription_no_notes')}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
