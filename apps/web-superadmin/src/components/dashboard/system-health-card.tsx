'use client';

import { CheckCircle2, ServerCrash, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { SystemHealth } from '@/types/super-admin';

type SystemHealthCardProps = {
  health: SystemHealth;
};

const STATUS_DOT: Record<'ok' | 'warn' | 'down', string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  down: 'bg-red-500',
};

export function SystemHealthCard({ health }: SystemHealthCardProps) {
  const t = useTranslations('dashboard.system_health');

  // Aggregate banner state — worst metric wins.
  const worst: 'ok' | 'warn' | 'down' = health.metrics.some((m) => m.status === 'down')
    ? 'down'
    : health.metrics.some((m) => m.status === 'warn')
      ? 'warn'
      : 'ok';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle hint={t('subtitle')}>{t('title')}</CardTitle>
      </CardHeader>

      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent dark:from-emerald-500/15 p-4 md:p-5">
        <p className="text-4xl md:text-5xl font-extrabold text-[#18794e] dark:text-emerald-400 tabular-nums leading-none">
          {health.uptime_pct.toFixed(2)}%
        </p>
        <p className="mt-1 text-sm text-[#62716d] dark:text-[#94a3b8]">{t('uptime_label')}</p>
      </div>

      <ul className="mt-4 flex flex-col">
        {health.metrics.map((metric, idx) => {
          const isLast = idx === health.metrics.length - 1;
          return (
            <li
              key={metric.label_key}
              className={cn(
                'flex items-center justify-between py-2.5',
                !isLast &&
                  'border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]',
              )}
            >
              <span className="flex items-center gap-2 text-sm text-[#62716d] dark:text-[#94a3b8]">
                <span
                  className={cn('inline-block h-2 w-2 rounded-full', STATUS_DOT[metric.status])}
                  aria-hidden="true"
                />
                {t(metric.label_key as Parameters<typeof t>[0])}
              </span>
              <span className="text-sm font-bold text-[#16221f] dark:text-white tabular-nums">
                {metric.value}
              </span>
            </li>
          );
        })}
      </ul>

      <StatusBanner status={worst} t={t} />
    </Card>
  );
}

type BannerStatus = 'ok' | 'warn' | 'down';

const BANNER_STYLES: Record<BannerStatus, string> = {
  ok: 'bg-emerald-50 ring-emerald-500/30 text-[#18794e] dark:bg-emerald-500/10 dark:text-emerald-400',
  warn: 'bg-amber-50 ring-amber-500/30 text-[#b7791f] dark:bg-amber-500/10 dark:text-amber-400',
  down: 'bg-red-50 ring-red-500/30 text-[#b42318] dark:bg-red-500/10 dark:text-red-400',
};

const BANNER_KEYS: Record<BannerStatus, 'all_ok' | 'degraded' | 'down'> = {
  ok: 'all_ok',
  warn: 'degraded',
  down: 'down',
};

function StatusBanner({
  status,
  t,
}: {
  status: BannerStatus;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = status === 'ok' ? CheckCircle2 : status === 'warn' ? ShieldAlert : ServerCrash;

  return (
    <div
      className={cn(
        'mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ring-1 ring-inset',
        BANNER_STYLES[status],
      )}
      role="status"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t(BANNER_KEYS[status])}</span>
    </div>
  );
}
