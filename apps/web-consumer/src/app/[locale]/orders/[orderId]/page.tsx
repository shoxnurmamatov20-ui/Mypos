'use client';

import { formatUZS } from '@mypos/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, RefreshCw } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { StatusTimeline } from '@/components/orders/status-timeline';
import {
  buildTimelineSteps,
  computeEtaMinutes,
  type TimelineStepLabels,
} from '@/lib/order-timeline';
import { deriveOrderStatus, loadMockOrder, type MockOrder, type MockOrderStatus } from '@/lib/save-order';

type Locale = 'uz' | 'ru' | 'en';
const SUPPORTED_LOCALES: readonly Locale[] = ['uz', 'ru', 'en'];
const TICK_INTERVAL_MS = 10_000;
const REFETCH_INTERVAL_MS = 30_000;

function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
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

function buildHeroCopy(
  t: ReturnType<typeof useTranslations>,
  status: MockOrderStatus,
): HeroCopy {
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

export default function OrderTrackingPage() {
  const t = useTranslations('order_tracking');
  const tCart = useTranslations('cart_page');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();
  const localeKey: Locale = isSupportedLocale(locale) ? locale : 'uz';
  const params = useParams<{ locale: string; orderId: string }>();
  const orderId = params?.orderId ?? '';

  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['mock-order', orderId], [orderId]);

  const { data: order, isLoading } = useQuery<MockOrder | null>({
    queryKey,
    queryFn: () => (orderId ? loadMockOrder(orderId) : null),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled: Boolean(orderId),
  });

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // `tick` drives status / ETA recompute between react-query refetches.
  const now = useMemo(() => {
    void tick;
    return new Date();
  }, [tick]);

  const status: MockOrderStatus = order ? deriveOrderStatus(order) : 'pending';
  const placedAt = order ? new Date(order.placedAt) : null;
  const etaMinutes = placedAt ? computeEtaMinutes(placedAt, status, now) : 0;
  const heroCopy = buildHeroCopy(t, status);
  const etaLabel =
    status === 'delivered'
      ? t('eta_delivered')
      : t('eta_remaining', { minutes: etaMinutes });

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

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey });
    setTick((v) => v + 1);
  };

  const handleViewReceipt = () => {
    if (typeof window !== 'undefined') {
      window.alert(t('view_receipt'));
    }
  };

  if (isLoading && !order) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500" />
      </div>
    );
  }

  if (!order || !placedAt) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BackHeader locale={locale} backLabel={tCommon('back')} title={t('title_prefix')} />
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={tCommon('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="flex-1 truncate font-display text-2xl font-extrabold text-neutral-900">
          {t('title_prefix')} #{order.orderNo}
        </h1>
        <button
          type="button"
          onClick={handleRefresh}
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

      <RestaurantCard
        order={order}
        orderRefLabel={`${t('title_prefix')} #${order.orderNo}`}
      />

      <ItemsCard order={order} itemsLabel={t('items_label')} locale={localeKey} />

      <SummaryCard order={order} t={tCart} locale={localeKey} />

      <div className="mt-6 flex flex-col gap-3">
        {status === 'delivered' && order.restaurantSlug ? (
          <Link
            href={`/${locale}/restaurant/${order.restaurantSlug}` as Route}
            className="flex h-12 items-center justify-center rounded-2xl bg-brand-500 px-6 font-bold text-white transition hover:bg-brand-600"
          >
            {t('reorder')}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleViewReceipt}
          className="flex h-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          {t('view_receipt')}
        </button>
      </div>
    </div>
  );
}

type BackHeaderProps = { locale: string; backLabel: string; title: string };

function BackHeader({ locale, backLabel, title }: BackHeaderProps) {
  return (
    <header className="flex items-center gap-3">
      <Link
        href={`/${locale}/orders` as Route}
        aria-label={backLabel}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <h1 className="font-display text-2xl font-extrabold text-neutral-900">{title}</h1>
    </header>
  );
}

type RestaurantCardProps = {
  order: MockOrder;
  orderRefLabel: string;
};

function RestaurantCard({ order, orderRefLabel }: RestaurantCardProps) {
  return (
    <section className="mt-6 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
        🍴
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-neutral-900">
          {order.restaurantName ?? '—'}
        </p>
        <p className="font-mono text-xs text-neutral-500">{orderRefLabel}</p>
      </div>
      <button
        type="button"
        aria-label="Call restaurant"
        onClick={() => {
          if (typeof window !== 'undefined') window.alert('Tez orada');
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-500 text-white transition hover:bg-mint-600"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
}

type ItemsCardProps = {
  order: MockOrder;
  itemsLabel: string;
  locale: Locale;
};

function ItemsCard({ order, itemsLabel, locale }: ItemsCardProps) {
  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
        {itemsLabel}
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
              {item.name}
            </span>
            <span className="text-sm font-medium text-neutral-500">
              {formatUZS(item.priceMinor * item.quantity, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type SummaryCardProps = {
  order: MockOrder;
  t: ReturnType<typeof useTranslations>;
  locale: Locale;
};

function SummaryCard({ order, t, locale }: SummaryCardProps) {
  const isFreeDelivery = order.amounts.deliveryFee === 0;
  return (
    <section className="mt-6 flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5">
      <SummaryRow
        label={t('summary_subtotal')}
        value={formatUZS(order.amounts.subtotal, locale)}
      />
      <SummaryRow
        label={t('summary_delivery')}
        value={
          isFreeDelivery
            ? t('summary_free')
            : formatUZS(order.amounts.deliveryFee, locale)
        }
        freeColor={isFreeDelivery}
      />
      <SummaryRow
        label={t('summary_service')}
        value={formatUZS(order.amounts.serviceFee, locale)}
      />
      <div className="my-1 h-px bg-neutral-100" />
      <SummaryRow
        label={t('summary_total')}
        value={formatUZS(order.amounts.total, locale)}
        emphasis
      />
    </section>
  );
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
  const labelClass = emphasis
    ? 'text-lg font-bold text-neutral-900'
    : 'text-sm text-neutral-500';
  return (
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
