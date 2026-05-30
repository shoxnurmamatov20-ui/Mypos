'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { KeyRound, Mail, Phone, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { TenantSummary } from '@/types/super-admin';

type Props = {
  tenant: TenantSummary;
  ownerPhone: string;
  onSendPasswordReset: () => void;
  locale: string;
};

const DATE_FNS_LOCALE: Record<string, Locale> = {
  uz,
  ru,
  en: enUS,
};

type Row = {
  icon: LucideIcon;
  labelKey: string;
  value: string;
  monospace?: boolean;
};

export function TenantOwnerCard({
  tenant,
  ownerPhone,
  onSendPasswordReset,
  locale,
}: Props) {
  const t = useTranslations('tenant_detail');
  const dateLocale = DATE_FNS_LOCALE[locale] ?? enUS;

  const lastLogin = tenant.last_active_at
    ? formatDistanceToNowStrict(new Date(tenant.last_active_at), {
        addSuffix: true,
        locale: dateLocale,
      })
    : t('owner_last_login');

  const rows: Row[] = [
    { icon: User, labelKey: 'owner_name', value: tenant.owner_name || '—' },
    { icon: Mail, labelKey: 'owner_email', value: tenant.owner_email || '—', monospace: true },
    { icon: Phone, labelKey: 'owner_phone', value: ownerPhone || '—', monospace: true },
  ];

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
        <CardTitle>{t('owner_title')}</CardTitle>
        <button
          type="button"
          onClick={onSendPasswordReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-3 text-xs font-semibold text-[#16221f] dark:text-gray-200 transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#0f766e] dark:hover:text-[#14b8a6] w-full sm:w-auto sm:ml-auto justify-center active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
        >
          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('send_password_reset')}</span>
        </button>
      </CardHeader>

      <dl className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.labelKey} className="flex items-center gap-3 text-sm">
              <Icon
                className="h-4 w-4 shrink-0 text-[#62716d] dark:text-[#94a3b8]"
                aria-hidden="true"
              />
              <dt className="w-24 shrink-0 text-[#62716d] dark:text-[#94a3b8]">
                {t(row.labelKey)}
              </dt>
              <dd
                className={
                  row.monospace
                    ? 'min-w-0 flex-1 truncate font-mono text-[#16221f] dark:text-white'
                    : 'min-w-0 flex-1 truncate text-[#16221f] dark:text-white'
                }
              >
                {row.value}
              </dd>
            </div>
          );
        })}

        <div className="flex items-center gap-3 border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)] pt-3 text-sm">
          <KeyRound
            className="h-4 w-4 shrink-0 text-[#62716d] dark:text-[#94a3b8]"
            aria-hidden="true"
          />
          <dt className="w-24 shrink-0 text-[#62716d] dark:text-[#94a3b8]">
            {t('owner_last_login')}
          </dt>
          <dd className="min-w-0 flex-1 truncate text-[#16221f] dark:text-gray-200">
            {lastLogin}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
