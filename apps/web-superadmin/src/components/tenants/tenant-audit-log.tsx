'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import {
  ArrowRight,
  CreditCard,
  Inbox,
  LogIn,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { MockAuditEvent } from '@/data/mock-tenant-detail';

type Props = {
  events: readonly MockAuditEvent[];
  locale: string;
  onViewAll: () => void;
};

const EVENT_ICON: Record<MockAuditEvent['type'], LucideIcon> = {
  login: LogIn,
  plan_change: TrendingUp,
  subscription_renewed: RefreshCcw,
  order_completed: ShoppingBag,
  payment: CreditCard,
};

const EVENT_LABEL: Record<MockAuditEvent['type'], string> = {
  login: 'audit_event_login',
  plan_change: 'audit_event_plan_change',
  subscription_renewed: 'audit_event_subscription_renewed',
  order_completed: 'audit_event_order_completed',
  payment: 'audit_event_payment',
};

const DATE_FNS_LOCALE: Record<string, Locale> = {
  uz,
  ru,
  en: enUS,
};

export function TenantAuditLog({ events, locale, onViewAll }: Props) {
  const t = useTranslations('tenant_detail');
  const dateLocale = DATE_FNS_LOCALE[locale] ?? enUS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('audit_title')}</CardTitle>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f766e] dark:text-[#14b8a6] transition-colors hover:text-[#0b5e57] dark:hover:text-[#2dd4bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          <span>{t('view_all')}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </CardHeader>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] p-6 text-center">
          <Inbox
            className="w-7 h-7 mb-2 text-gray-300 dark:text-gray-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('audit_empty')}</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => {
            const Icon = EVENT_ICON[event.type];
            const relative = formatDistanceToNowStrict(new Date(event.created_at), {
              addSuffix: true,
              locale: dateLocale,
            });
            return (
              <li key={event.id} className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4f3] dark:bg-[#1a2235] text-[#62716d] dark:text-[#94a3b8]"
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#16221f] dark:text-white">
                    {t(EVENT_LABEL[event.type])}
                  </p>
                  <p className="text-xs text-[#62716d] dark:text-[#94a3b8]">
                    <span className="font-mono">{event.actor}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{relative}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
