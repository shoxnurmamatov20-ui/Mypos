'use client';

import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { OrderCard, totalItemsInOrder } from '@/components/orders/order-card';
import { type DateLocale, formatRelativeDate } from '@/lib/relative-date';
import {
  deriveOrderStatus,
  loadAllMockOrders,
  type MockOrder,
  type MockOrderStatus,
} from '@/lib/save-order';

type FilterKey = 'all' | 'active' | 'completed';
const FILTER_KEYS: readonly FilterKey[] = ['all', 'active', 'completed'];
const REFETCH_INTERVAL_MS = 30_000;
const SUPPORTED_LOCALES: readonly DateLocale[] = ['uz', 'ru', 'en'];

function isSupportedLocale(value: string): value is DateLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function statusLabelKey(status: MockOrderStatus): string {
  return status;
}

type Enriched = {
  order: MockOrder;
  status: MockOrderStatus;
  itemCount: number;
};

export default function OrdersPage() {
  const t = useTranslations('orders_page');
  const tStatus = useTranslations('order_status');
  const locale = useLocale();
  const dateLocale: DateLocale = isSupportedLocale(locale) ? locale : 'uz';

  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: orders } = useQuery<MockOrder[]>({
    queryKey: ['mock-orders-list'],
    queryFn: () => loadAllMockOrders(),
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const dateLabels = useMemo(() => ({ today: t('today'), yesterday: t('yesterday') }), [t]);

  const enriched: Enriched[] = useMemo(() => {
    const list = orders ?? [];
    return list.map((o) => ({
      order: o,
      status: deriveOrderStatus(o),
      itemCount: totalItemsInOrder(o),
    }));
  }, [orders]);

  const filtered = useMemo(() => {
    if (filter === 'active') return enriched.filter((e) => e.status !== 'delivered');
    if (filter === 'completed') return enriched.filter((e) => e.status === 'delivered');
    return enriched;
  }, [enriched, filter]);

  const filterLabels: Record<FilterKey, string> = {
    all: t('filter_all'),
    active: t('filter_active'),
    completed: t('filter_completed'),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
        {t('title')}
      </h1>

      <div className="sticky top-16 z-20 -mx-4 mt-6 bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-2 overflow-x-auto">
          {FILTER_KEYS.map((key) => (
            <FilterChip
              key={key}
              label={filterLabels[key]}
              active={filter === key}
              onClick={() => setFilter(key)}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          locale={locale}
          title={t('empty_title')}
          hint={t('empty_hint')}
          browseLabel={t('browse')}
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {filtered.map(({ order, status, itemCount }) => (
            <li key={order.id}>
              <OrderCard
                order={order}
                status={status}
                href={`/${locale}/orders/${order.id}` as Route}
                labels={{
                  status: tStatus(statusLabelKey(status)),
                  itemsCount: t('items_count', { count: itemCount }),
                  totalText: formatUZS(order.amounts.total, dateLocale),
                  dateText: formatRelativeDate(order.placedAt, dateLocale, dateLabels),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'h-9 shrink-0 rounded-full bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600'
          : 'h-9 shrink-0 rounded-full bg-neutral-100 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200'
      }
    >
      {label}
    </button>
  );
}

type EmptyStateProps = {
  locale: string;
  title: string;
  hint: string;
  browseLabel: string;
};

function EmptyState({ locale, title, hint, browseLabel }: EmptyStateProps) {
  return (
    <div className="mx-auto mt-12 max-w-md text-center">
      <p className="text-9xl opacity-30" aria-hidden="true">
        📦
      </p>
      <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-500">{hint}</p>
      <Link
        href={`/${locale}/search` as Route}
        className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
      >
        {browseLabel}
      </Link>
    </div>
  );
}
