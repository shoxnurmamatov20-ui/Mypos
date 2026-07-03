'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Info, ListChecks, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AuditLogRecord } from '@/lib/api-helpers';
import { cn } from '@/lib/cn';

/** UI-visible severities (we hide `debug` from filters but still count it as info). */
export type DisplaySeverity = 'info' | 'warning' | 'error' | 'critical';
export type SeverityChipFilter = 'all' | DisplaySeverity;

export type SeverityCounts = {
  total: number;
  info: number;
  warning: number;
  error: number;
  critical: number;
};

/** Roll up a list of API records into severity buckets (debug counted as info). */
export function computeSeverityCounts(
  logs: ReadonlyArray<Pick<AuditLogRecord, 'severity'>>,
): SeverityCounts {
  const out: SeverityCounts = { total: logs.length, info: 0, warning: 0, error: 0, critical: 0 };
  for (const log of logs) {
    if (log.severity === 'info' || log.severity === 'debug') out.info++;
    else if (log.severity === 'warning') out.warning++;
    else if (log.severity === 'error') out.error++;
    else if (log.severity === 'critical') out.critical++;
  }
  return out;
}

type ChipDef = {
  key: SeverityChipFilter;
  /** i18n suffix — combined with `severity_chip_` prefix at render time. */
  labelKey: string;
  count: keyof SeverityCounts;
  icon: LucideIcon;
  /** Classes applied when this chip is the active filter. */
  active: string;
  /** Inactive count badge classes (so the count remains color-coded as a hint). */
  countTint: string;
};

const CHIPS: ReadonlyArray<ChipDef> = [
  {
    key: 'all',
    labelKey: 'all',
    count: 'total',
    icon: ListChecks,
    active:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
    countTint: 'text-gray-900 dark:text-white',
  },
  {
    key: 'info',
    labelKey: 'info',
    count: 'info',
    icon: Info,
    active:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    countTint: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'warning',
    labelKey: 'warning',
    count: 'warning',
    icon: AlertTriangle,
    active:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    countTint: 'text-amber-800 dark:text-amber-300',
  },
  {
    key: 'error',
    labelKey: 'error',
    count: 'error',
    icon: AlertCircle,
    active:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
    countTint: 'text-red-700 dark:text-red-300',
  },
  {
    key: 'critical',
    labelKey: 'critical',
    count: 'critical',
    icon: ShieldAlert,
    active:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/25 dark:text-red-200 dark:border-red-500/50',
    countTint: 'text-red-800 dark:text-red-200',
  },
];

type Props = {
  current: SeverityChipFilter;
  onChange: (next: SeverityChipFilter) => void;
  counts: SeverityCounts;
};

/**
 * Severity filter chips for the audit log. Each chip is a toggle
 * button with `aria-pressed` so screen readers announce the active
 * state; an icon prefixes the label to communicate severity at a
 * glance, and a count badge on the right uses tabular numerals.
 */
export function AuditSeverityChips({ current, onChange, counts }: Props) {
  const t = useTranslations('audit_page');

  return (
    <div
      role="group"
      aria-label={t('filter_severity')}
      className="flex flex-wrap items-center gap-1.5"
    >
      {CHIPS.map((c) => {
        const isActive = current === c.key;
        const value = counts[c.count];
        const Icon = c.icon;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(c.key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-[0.04em]',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              isActive
                ? c.active
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white active:scale-[0.98]',
            )}
          >
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span>{t(`severity_chip_${c.labelKey}`)}</span>
            <span className={cn('tabular-nums font-bold', isActive ? '' : c.countTint)}>
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
