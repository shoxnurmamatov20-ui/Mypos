'use client';

import { formatDistanceToNow } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowRight, CircleAlert, Info, ShieldAlert } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { AuditEntry, AuditSeverity } from '@/types/super-admin';
import { SeverityBadge } from './badges';

type ActivityFeedProps = {
  entries: AuditEntry[];
  locale: string;
};

const LOCALE_MAP = { uz, ru, en: enUS } as const;

const SEVERITY_ICON: Record<AuditSeverity, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: CircleAlert,
  critical: ShieldAlert,
};

const SEVERITY_DOT: Record<AuditSeverity, string> = {
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  error: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300',
};

export function ActivityFeed({ entries, locale }: ActivityFeedProps) {
  const t = useTranslations('dashboard.activity');
  const tActions = useTranslations('dashboard.activity.actions');
  const tSeverity = useTranslations('dashboard.severity');

  const dfLocale = LOCALE_MAP[locale as keyof typeof LOCALE_MAP] ?? uz;
  const auditHref = `/${locale}/audit` as Route;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle hint={t('subtitle')}>{t('title')}</CardTitle>
        <Link
          href={auditHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#0f766e] dark:text-[#14b8a6] transition-colors hover:text-[#0b5e57] dark:hover:text-[#2dd4bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          {t('see_all')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardHeader>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Info
            className="h-7 w-7 text-gray-300 dark:text-gray-700 mb-2"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-[#62716d] dark:text-[#94a3b8]">{t('subtitle')}</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry, idx) => {
            const Icon = SEVERITY_ICON[entry.severity];
            const isLast = idx === entries.length - 1;
            const relTime = formatDistanceToNow(new Date(entry.created_at), {
              addSuffix: true,
              locale: dfLocale,
            });
            return (
              <li
                key={entry.id}
                className={cn(
                  'flex items-start gap-3 py-3',
                  !isLast &&
                    'border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    SEVERITY_DOT[entry.severity],
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-[#16221f] dark:text-white">
                      {tActions(entry.action_key as Parameters<typeof tActions>[0])}
                    </p>
                    <SeverityBadge severity={entry.severity} label={tSeverity(entry.severity)} />
                  </div>
                  <p className="truncate text-sm text-[#62716d] dark:text-[#94a3b8]">
                    <span className="text-[#16221f] dark:text-gray-300">{entry.actor}</span>
                    <span className="text-gray-300 dark:text-gray-600"> · </span>
                    <span>{entry.subject}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#62716d] dark:text-[#94a3b8]">{relTime}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
