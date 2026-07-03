'use client';

import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** 4 grey stat skeletons, used on every list page above the table. */
export function StatStripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-[12px] border border-[rgba(22,34,31,0.09)] bg-white p-4 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]"
        >
          <div className="h-3 w-20 rounded bg-[#eef4f3] dark:bg-[#1a2235]" />
          <div className="mt-3 h-7 w-24 rounded bg-[#eef4f3] dark:bg-[#1a2235]" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className="border-b border-[rgba(22,34,31,0.09)] bg-[#eef4f3] px-4 py-3 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235]">
        <div className="h-3 w-32 rounded bg-white/60 dark:bg-[#0d1424]" />
      </div>
      <div className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
        {Array.from({ length: rows }).map((_, ri) => (
          <div
            key={ri}
            className="grid items-center gap-3 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((__, ci) => (
              <div key={ci} className="h-3 animate-pulse rounded bg-[#eef4f3] dark:bg-[#1a2235]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#62716d] dark:text-[#94a3b8]">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label ?? '...'}
    </div>
  );
}

type ErrorBannerProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const t = useTranslations('inventory');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{message ?? t('toast.load_failed')}</span>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
        >
          {t('actions.retry')}
        </button>
      ) : null}
    </div>
  );
}

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(22,34,31,0.15)] bg-white px-6 py-14 text-center dark:border-[rgba(255,255,255,0.10)] dark:bg-[#111827]">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef4f3] text-[#0f766e] dark:bg-[#1a2235] dark:text-teal-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#16221f] dark:text-white">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-xs text-[#62716d] dark:text-[#94a3b8]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Simple shared input/select className strings for use in form rows. */
export const inputClass =
  'w-full rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500';

export const labelClass = 'mb-1 block text-xs font-semibold text-[#16221f] dark:text-[#e2e8f0]';

export const primaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5e58] disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-400';

export const secondaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-4 py-2 text-sm font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:bg-transparent dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]';

export const dangerBtnClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50';
