'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { StatusTimeline } from '@/components/orders/status-timeline';
import { formatSom } from '@/lib/format';
import { usePublicOrderTracking } from '@/lib/hooks/use-public-restaurants';
import {
  buildTimelineSteps,
  computeEtaMinutes,
  type TimelineStepLabels,
} from '@/lib/order-timeline';
import {
  isPublicLocale,
  type PublicLocale,
  type PublicOrderResponse,
  type PublicOrderTrackingStatus,
  pickTranslation,
} from '@/lib/public-api';
import type { MockOrderStatus } from '@/lib/save-order';

type Props = {
  token: string;
  locale: string;
  initialData: PublicOrderResponse | null;
};

const TICK_INTERVAL_MS = 10_000;

/**
 * Client surface for the public tracking screen.
 *
 * Bootstraps from the server-fetched response so the first paint has the
 * correct status. From then on TanStack Query polls every 30s; once
 * Reverb is plumbed in we'll subscribe to `orders.{token}.updated`
 * instead.
 */
export function OrderTrackingView({ token, locale, initialData }: Props) {
  const t = useTranslations('order_tracking');
  const tCart = useTranslations('cart_page');
  const tCommon = useTranslations('common');
  const localeRaw = useLocale();
  const apiLocale: PublicLocale = isPublicLocale(localeRaw)
    ? localeRaw
    : isPublicLocale(locale)
      ? (locale as PublicLocale)
      : 'uz';

  const { data, isLoading, refetch, dataUpdatedAt } = usePublicOrderTracking(token, {
    initialData: initialData ?? undefined,
  });

  const order = data?.data ?? initialData?.data ?? null;

  // Tick drives the relative-time labels between fetch cycles.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  const now = useMemo(() => {
    void tick;
    void dataUpdatedAt;
    return new Date();
  }, [tick, dataUpdatedAt]);

  const status: MockOrderStatus = order ? toMockStatus(order.status) : 'pending';
  const placedAt = order ? new Date(order.placed_at) : null;
  const etaMinutes = placedAt ? computeEtaMinutes(placedAt, status, now) : 0;

  const heroCopy = order ? buildHeroCopy(t, status) : null;
  const etaLabel =
    status === 'delivered' ? t('eta_delivered') : t('eta_remaining', { minutes: etaMinutes });

  const stepLabels: TimelineStepLabels = useMemo(
    () => ({
      pending: t('step1_name'),
      preparing: t('step2_name'),
      ready: t('step3_name'),
      on_the_way: t('step4_name'),
      delivered: t('step5_name'),
      inProgress: t('now'),
      approxMinutes: (minutes: number) => t('approx', { minutes }),
    }),
    [t],
  );

  const steps = placedAt ? buildTimelineSteps(placedAt, status, now, stepLabels) : [];

  if (isLoading && !order) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500" />
      </div>
    );
  }

  if (!order || !placedAt || !heroCopy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center gap-3">
          <Link
            href={`/${locale}` as Route}
            aria-label={tCommon('back')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-neutral-900">
            {t('title_prefix')}
          </h1>
        </header>
        <div className="mt-12 flex flex-col items-center text-center">
          <p className="text-7xl opacity-30" aria-hidden="true">
            🔍
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">
            {t('not_found')}
          </h2>
        </div>
      </div>
    );
  }

  const restaurantName = order.restaurant ? pickTranslation(order.restaurant.name, apiLocale) : '—';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/${locale}` as Route}
          aria-label={tCommon('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="flex-1 truncate font-display text-2xl font-extrabold text-neutral-900">
          {t('title_prefix')} #{order.order_no}
        </h1>
        <button
          type="button"
          onClick={() => void refetch()}
          aria-label={t('refresh')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <RefreshCw className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <section
        aria-labelledby="status-hero-title"
        className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-purple-600 p-8 text-center text-white"
      >
        <p className="text-7xl" aria-hidden="true">
          {statusEmoji(status)}
        </p>
        <h2 id="status-hero-title" className="mt-3 font-display text-3xl font-extrabold">
          {heroCopy.title}
        </h2>
        <p className="mt-2 text-base text-white/80">{heroCopy.subtitle}</p>
        <span className="mt-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">
          {etaLabel}
        </span>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <StatusTimeline steps={steps} />
      </section>

      <section className="mt-6 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
          🍴
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-neutral-900">{restaurantName}</p>
          <p className="font-mono text-xs text-neutral-500">
            {t('title_prefix')} #{order.order_no}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          {t('items_label')}
        </h3>
        <ul className="mt-3 flex flex-col divide-y divide-neutral-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700"
                aria-hidden="true"
              >
                {item.quantity}×
              </span>
              <span className="flex-1 truncate text-sm font-medium text-neutral-900">
                {pickTranslation(item.name, apiLocale)}
              </span>
              <span className="text-sm font-medium text-neutral-500">
                {formatSom(item.price_minor * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5">
        <SummaryRow label={tCart('summary_subtotal')} value={formatSom(order.amounts.subtotal)} />
        <SummaryRow
          label={tCart('summary_delivery')}
          value={
            order.amounts.delivery_fee === 0
              ? tCart('summary_free')
              : formatSom(order.amounts.delivery_fee)
          }
          freeColor={order.amounts.delivery_fee === 0}
        />
        <SummaryRow label={tCart('summary_service')} value={formatSom(order.amounts.service_fee)} />
        <div className="my-1 h-px bg-neutral-100" />
        <SummaryRow
          label={tCart('summary_total')}
          value={formatSom(order.amounts.total)}
          emphasis
        />
      </section>
    </div>
  );
}

// ------------ Local helpers ------------

function toMockStatus(api: PublicOrderTrackingStatus): MockOrderStatus {
  switch (api) {
    case 'pending':
    case 'preparing':
    case 'ready':
    case 'on_the_way':
    case 'delivered':
      return api;
    case 'cancelled':
      // Cancelled orders are rare here — show as pending until we have a
      // proper cancelled state in the timeline.
      return 'pending';
  }
}

function statusEmoji(status: MockOrderStatus): string {
  switch (status) {
    case 'pending':
      return '📝';
    case 'preparing':
      return '👨‍🍳';
    case 'ready':
      return '✅';
    case 'on_the_way':
      return '🛵';
    case 'delivered':
      return '🎉';
  }
}

type HeroCopy = { title: string; subtitle: string };

function buildHeroCopy(t: ReturnType<typeof useTranslations>, status: MockOrderStatus): HeroCopy {
  switch (status) {
    case 'pending':
      return {
        title: t('status_pending_title'),
        subtitle: t('status_pending_subtitle'),
      };
    case 'preparing':
      return {
        title: t('status_preparing_title'),
        subtitle: t('status_preparing_subtitle'),
      };
    case 'ready':
      return {
        title: t('status_ready_title'),
        subtitle: t('status_ready_subtitle'),
      };
    case 'on_the_way':
      return {
        title: t('status_on_way_title'),
        subtitle: t('status_on_way_subtitle'),
      };
    case 'delivered':
      return {
        title: t('status_delivered_title'),
        subtitle: t('status_delivered_subtitle'),
      };
  }
}

type SummaryRowProps = {
  label: string;
  value: string;
  emphasis?: boolean;
  freeColor?: boolean;
};

function SummaryRow({ label, value, emphasis, freeColor }: SummaryRowProps) {
  const valueClass = emphasis
    ? 'text-2xl font-bold text-brand-500'
    : freeColor
      ? 'text-sm font-bold text-mint-600'
      : 'text-sm font-medium text-neutral-900';
  const labelClass = emphasis ? 'text-lg font-bold text-neutral-900' : 'text-sm text-neutral-500';
  return (
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
