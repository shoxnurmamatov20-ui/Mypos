'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

export type DashboardPeriod = '7d' | '30d' | '90d';

const PERIODS: readonly DashboardPeriod[] = ['7d', '30d', '90d'] as const;

type PeriodSelectorProps = {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
};

/**
 * Segmented control for the chart time-range. Pure presentation — the
 * parent decides what to refetch when the value changes. Keys map to
 * `dashboard.period_*` translations.
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const t = useTranslations('dashboard');

  return (
    <div
      className="inline-flex rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#eef4f3] dark:bg-[#1a2235] p-1"
      role="tablist"
      aria-label="Period"
    >
      {PERIODS.map((period) => {
        const isActive = period === value;
        return (
          <button
            key={period}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(period)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
              isActive
                ? 'bg-white dark:bg-[#111827] text-[#0f766e] dark:text-[#14b8a6] shadow-sm'
                : 'text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white',
            )}
          >
            {t(`period_${period}`)}
          </button>
        );
      })}
    </div>
  );
}
