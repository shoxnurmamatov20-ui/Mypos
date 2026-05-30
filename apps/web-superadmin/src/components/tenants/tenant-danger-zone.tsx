'use client';

import { AlertTriangle, PauseCircle, Trash2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

type Props = {
  onSuspend: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function TenantDangerZone({ onSuspend, onCancel, onDelete }: Props) {
  const t = useTranslations('tenant_detail');

  return (
    <section
      className="rounded-xl border border-red-300/50 dark:border-red-500/30 bg-red-50/50 dark:bg-red-950/20 p-4 md:p-5"
      aria-labelledby="danger-zone-title"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-[#b42318] dark:text-red-400"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3
            id="danger-zone-title"
            className="text-base md:text-lg font-bold text-[#b42318] dark:text-red-300 leading-tight"
          >
            {t('danger_zone_title')}
          </h3>
          <p className="mt-0.5 text-sm text-red-700/80 dark:text-red-400/70">
            {t('danger_zone_subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <button
          type="button"
          onClick={onSuspend}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors active:scale-95',
            'border-red-300 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-[#b42318] dark:text-red-300',
            'hover:bg-red-50 dark:hover:bg-red-500/20 hover:border-red-400 dark:hover:border-red-500/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
          )}
        >
          <PauseCircle className="h-4 w-4" aria-hidden="true" />
          <span>{t('suspend_button')}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors active:scale-95',
            'border-red-300 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-[#b42318] dark:text-red-300',
            'hover:bg-red-50 dark:hover:bg-red-500/20 hover:border-red-400 dark:hover:border-red-500/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
          )}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          <span>{t('cancel_button')}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-500 dark:bg-red-600 px-3.5 text-sm font-bold text-white transition-colors active:scale-95',
            'hover:bg-red-600 dark:hover:bg-red-700',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]',
          )}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>{t('delete_button')}</span>
        </button>
      </div>
    </section>
  );
}
