'use client';

import { useTranslations } from 'next-intl';
import { TenantPlanBadge } from './tenant-plan-badge';
import { cn } from '@/lib/cn';
import { pickAvatarColor } from '@/lib/tenant-utils';
import type { TrialDays } from './_new-tenant-schema';
import type { TenantPlan } from '@/types/super-admin';

type Props = {
  name: string;
  slug: string;
  plan: TenantPlan;
  trialDays: TrialDays;
  ownerName: string;
};

export function NewTenantPreview({
  name,
  slug,
  plan,
  trialDays,
  ownerName,
}: Props) {
  const t = useTranslations('tenant_new');

  const previewName = name || t('preview_default_name');
  const previewSlug = slug || t('preview_default_slug');
  const previewOwner = ownerName || t('preview_default_owner');

  const trialLabel =
    trialDays === '0'
      ? t('trial_0_days')
      : trialDays === '7'
        ? t('trial_7_days')
        : trialDays === '14'
          ? t('trial_14_days')
          : t('trial_30_days');

  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] transition-colors">
      <header className="border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)] px-5 py-3.5 bg-[#eef4f3] dark:bg-[#1a2235]">
        <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#62716d] dark:text-[#94a3b8]">
          {t('preview_title')}
        </p>
      </header>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white flex-shrink-0',
              pickAvatarColor(previewSlug),
            )}
            aria-hidden="true"
          >
            {previewName.trim().charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-[#16221f] dark:text-white leading-tight">
              {previewName}
            </p>
            <p className="truncate font-mono text-xs text-[#62716d] dark:text-[#94a3b8] mt-0.5">
              {previewSlug}
            </p>
          </div>
        </div>

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('preview_url_label')}</dt>
            <dd className="font-mono text-xs text-[#16221f] dark:text-gray-200 truncate">
              {previewSlug}.mypos.uz
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('preview_plan_label')}</dt>
            <dd>
              <TenantPlanBadge plan={plan} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('preview_trial_label')}</dt>
            <dd className="text-[#16221f] dark:text-gray-200 tabular-nums">{trialLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('preview_owner_label')}</dt>
            <dd className="truncate text-[#16221f] dark:text-gray-200 min-w-0">{previewOwner}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
