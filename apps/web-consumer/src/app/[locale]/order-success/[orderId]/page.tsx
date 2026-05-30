'use client';

import { motion } from 'framer-motion';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Home, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { formatSom } from '@/lib/format';
import { type MockOrder, loadMockOrder } from '@/lib/save-order';

/**
 * Order success page — `/[locale]/order-success/[orderId]`.
 *
 * Reads the order from localStorage (written by the checkout submit flow)
 * and renders a celebratory confirmation screen with the order ID,
 * estimated delivery window, total amount, and the address it's heading to.
 * Two CTAs: Track order (Phase 6) and Home.
 */
export default function OrderSuccessPage() {
  const t = useTranslations('order_success');
  const locale = useLocale();
  const params = useParams<{ locale: string; orderId: string }>();
  const localeFromParams = params?.locale ?? locale;
  const orderId = params?.orderId ?? '';

  const [order, setOrder] = useState<MockOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!orderId) return;
    setOrder(loadMockOrder(orderId));
  }, [orderId]);

  // Loading state — first paint, before localStorage read settles.
  if (order === undefined) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm text-neutral-500">{t('loading')}</p>
      </div>
    );
  }

  // Not-found state.
  if (order === null) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-6xl" aria-hidden="true">
          🔍
        </p>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-neutral-900 sm:text-3xl">
          {t('not_found')}
        </h1>
        <p className="mt-3 max-w-md text-base text-neutral-500">{t('not_found_subtitle')}</p>
        <Link
          href={`/${localeFromParams}` as Route}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-brand-500 px-6 text-sm font-bold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          {t('go_home')}
        </Link>
      </div>
    );
  }

  // Happy path. Prefer the public tracking URL when the API returned a
  // tracking token (new orders); fall back to the legacy `/orders/[id]`
  // route for orders saved before the tracking flow shipped.
  const trackHref = (order.trackingToken
    ? `/${localeFromParams}/track/${order.trackingToken}`
    : `/${localeFromParams}/orders/${order.id}`) as Route;
  const homeHref = `/${localeFromParams}` as Route;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 text-center sm:px-6 sm:py-16">
      {/* Animated check */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-mint-100 sm:h-36 sm:w-36"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-mint-500 sm:h-28 sm:w-28"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.5 }}
          >
            <Check
              className="h-14 w-14 text-white sm:h-16 sm:w-16"
              strokeWidth={3.5}
              aria-hidden="true"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-8 font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl"
      >
        {t('title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="mt-3 text-base text-neutral-500 sm:text-lg"
      >
        {t('subtitle')}
      </motion.p>

      {/* Order details card */}
      <motion.dl
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        className="mx-auto mt-8 flex max-w-md flex-col gap-4 rounded-3xl bg-neutral-50 p-6 text-left sm:p-7"
      >
        <DetailRow
          label={t('order_number')}
          value={`#${order.orderNo}`}
          mono
        />
        <DetailRow label={t('estimated_delivery')} value={t('estimated_minutes')} />
        <DetailRow label={t('total_amount')} value={formatSom(order.amounts.total)} bold />
        <DetailRow
          label={t('address')}
          value={`${order.address.label} — ${order.address.street}`}
          icon={<MapPin className="h-4 w-4 text-neutral-400" aria-hidden="true" />}
        />
      </motion.dl>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.75 }}
        className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      >
        <Link
          href={trackHref}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand-500 px-6 text-base font-bold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 sm:w-auto sm:min-w-[200px]"
        >
          {t('track_order')}
        </Link>
        <Link
          href={homeHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 text-base font-bold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 sm:w-auto sm:min-w-[160px]"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          {t('go_home')}
        </Link>
      </motion.div>
    </div>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
};

function DetailRow({ label, value, bold, mono, icon }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex shrink-0 items-center gap-1.5 text-sm text-neutral-500">
        {icon}
        {label}
      </dt>
      <dd
        className={`text-right text-sm ${bold ? 'font-display text-lg font-extrabold' : 'font-semibold'} ${
          mono ? 'tabular-nums' : ''
        } text-neutral-900`}
      >
        {value}
      </dd>
    </div>
  );
}
