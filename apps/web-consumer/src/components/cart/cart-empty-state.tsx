'use client';

import { ShoppingBag } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type Props = {
  locale: string;
};

/**
 * Friendly empty cart placeholder.
 *
 * Shown both on the cart page (when items.length === 0) and on the
 * checkout page if the user navigates there with an empty cart and we
 * haven't redirected yet.
 */
export function CartEmptyState({ locale }: Props) {
  const t = useTranslations('cart_page');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center sm:py-24">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-50 sm:h-40 sm:w-40">
        <ShoppingBag
          className="h-16 w-16 text-brand-500 sm:h-20 sm:w-20"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      </div>
      <h2 className="mt-8 font-display text-2xl font-extrabold text-neutral-900 sm:text-3xl">
        {t('empty_title')}
      </h2>
      <p className="mt-3 max-w-md text-base text-neutral-500">{t('empty_subtitle')}</p>
      <Link
        href={`/${locale}` as Route}
        className="mt-8 inline-flex h-12 items-center rounded-2xl bg-brand-500 px-8 text-base font-bold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
      >
        {t('browse_restaurants')}
      </Link>
    </div>
  );
}
