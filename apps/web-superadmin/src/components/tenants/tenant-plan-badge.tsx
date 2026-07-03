'use client';

import { useTranslations } from 'next-intl';
import type { TenantPlan } from '@/types/super-admin';

/**
 * Plan badge styles map. Class strings are written literally (no template
 * concatenation) so Tailwind's content scanner picks them up.
 */
/**
 * Plan badge palette. Each row has light + dark variants. Tailwind
 * scans literal class strings so we keep both spelled out.
 */
const PLAN_STYLES: Record<TenantPlan, string> = {
  free: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  starter:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  pro: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  plus: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
  business:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  enterprise:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
};

export function TenantPlanBadge({ plan }: { plan: TenantPlan }) {
  const t = useTranslations('plans');
  const style = PLAN_STYLES[plan];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {t(plan)}
    </span>
  );
}
