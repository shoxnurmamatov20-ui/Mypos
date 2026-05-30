'use client';

import { ArrowRight, Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { ceoFetch, type Restaurant, type RestaurantsResponse } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCompactUZS, formatNumber } from '@/lib/format';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000/panel/manager';

type StatusVariant = 'success' | 'warning' | 'destructive' | 'secondary';

const STATUS_VARIANT: Record<string, StatusVariant> = {
  active: 'success',
  trialing: 'warning',
  past_due: 'destructive',
  suspended: 'destructive',
  cancelled: 'secondary',
};

export function RestaurantsClient({ locale }: { locale: string }) {
  const t = useTranslations('restaurants');
  const [items, setItems] = useState<Restaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ceoFetch<RestaurantsResponse>('/api/v1/ceo/restaurants')
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((e) => {
        if (cancelled) return;
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <div className="space-y-3.5">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          items ? (
            <span className="inline-flex items-center rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-2.5 h-8 text-[12px] font-bold tabular-nums text-[#16221f] dark:text-white">
              {t('count', { count: items.length })}
            </span>
          ) : undefined
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
          {error}
        </div>
      ) : items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[180px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
          <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
          <p className="text-[13px]">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantCard({
  restaurant: r,
  locale,
  t,
}: {
  restaurant: Restaurant;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const dashboardUrl = `${DASHBOARD_URL}/${locale}/overview?tenant=${r.slug}`;
  const variant = STATUS_VARIANT[r.status] ?? 'secondary';

  return (
    <article className="flex flex-col rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors">
      <div className="flex items-start gap-3">
        {r.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.logo_url}
            alt={r.name}
            className="h-11 w-11 rounded-[10px] object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-11 w-11 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0">
            {r.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white truncate">
              {r.name}
            </h3>
            {r.is_primary ? (
              <span className="inline-flex items-center rounded bg-[rgba(15,118,110,0.1)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f766e] dark:bg-[rgba(20,184,166,0.18)] dark:text-[#14b8a6]">
                {t('primary')}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8] uppercase tracking-wide">
            {r.tier}
          </p>
          <div className="mt-1.5">
            <Badge variant={variant}>{r.status}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <MiniStat label={t('today_revenue')} value={formatCompactUZS(r.today.revenue_minor)} />
        <MiniStat label={t('today_orders')} value={formatNumber(r.today.orders_count)} />
      </div>

      <a
        href={dashboardUrl}
        className={cn(
          'mt-3.5 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[13px] font-semibold transition-colors active:scale-95',
          'bg-blue-50 text-blue-700 hover:bg-blue-100',
          'dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50',
        )}
      >
        {t('manage')}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </a>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[#f8fafc] dark:bg-[#1a2235] p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-black tabular-nums text-[#16221f] dark:text-white">
        {value}
      </p>
    </div>
  );
}
