'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@mypos/ui';

type AnyStatus =
  | 'draft'
  | 'posted'
  | 'cancelled'
  | 'in_progress'
  | 'completed'
  | 'sent'
  | 'received';

const TONE: Record<AnyStatus, string> = {
  draft:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  posted:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  cancelled:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  in_progress:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  completed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  sent:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  received:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus | string;
  className?: string;
}) {
  const t = useTranslations('inventory.status');
  const tone = TONE[status as AnyStatus] ?? TONE.draft;
  const label = (() => {
    try {
      return t(status as AnyStatus);
    } catch {
      return status;
    }
  })();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]',
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}

const REASON_TONE: Record<string, string> = {
  expired:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  damaged:
    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  lost:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  theft:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  other:
    'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
};

export function ReasonBadge({
  reason,
  className,
}: {
  reason: string;
  className?: string;
}) {
  const t = useTranslations('inventory.reasons');
  const tone = REASON_TONE[reason] ?? REASON_TONE.other;
  const label = (() => {
    try {
      return t(reason);
    } catch {
      return reason;
    }
  })();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]',
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
