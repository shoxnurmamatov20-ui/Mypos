'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import { formatSom } from '@/lib/format';
import {
  selectCartCount,
  selectCartTotal,
  useCartStore,
} from '@/stores/cart';

type RestaurantCartPanelProps = {
  restaurantSlug: string;
  locale: 'uz' | 'ru' | 'en';
};

/**
 * Sticky right-rail cart summary for the detail page.
 *
 * Only shows items belonging to the current restaurant — the cart
 * model already enforces single-restaurant carts (see `addItem`), but
 * this panel guards against transient UI states where someone navigates
 * to a different restaurant before the cart resets.
 */
export function RestaurantCartPanel({ restaurantSlug, locale }: RestaurantCartPanelProps) {
  const t = useTranslations('restaurant_detail');
  const items = useCartStore((s) => s.items);
  const cartSlug = useCartStore((s) => s.restaurantSlug);
  const total = useCartStore(selectCartTotal);
  const count = useCartStore(selectCartCount);

  const visibleItems = cartSlug === restaurantSlug ? items : [];
  const visibleTotal = visibleItems.length > 0 ? total : 0;
  const visibleCount = visibleItems.length > 0 ? count : 0;

  const cartHref = `/${locale}/cart` as Route;

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold text-neutral-900">{t('cart_title')}</h2>
        {visibleCount > 0 ? (
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-bold text-white">
            {visibleCount}
          </span>
        ) : null}
      </header>

      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-5xl" aria-hidden="true">
            🛒
          </span>
          <p className="text-sm font-semibold text-neutral-900">{t('cart_empty')}</p>
          <p className="text-xs text-neutral-500">{t('cart_empty_hint')}</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visibleItems.map((line) => (
              <li
                key={line.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-100 p-3"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${line.bgColor}`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {line.emoji}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-1 text-sm font-bold text-neutral-900">
                    {line.name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {line.quantity} × {formatSom(line.priceMinor)}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-neutral-900">
                  {formatSom(line.priceMinor * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-sm font-semibold text-neutral-600">{t('subtotal')}</span>
            <span className="text-lg font-extrabold tabular-nums text-neutral-900">
              {formatSom(visibleTotal)}
            </span>
          </div>

          <Link
            href={cartHref}
            className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-brand-500 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('place_order')}
          </Link>
        </>
      )}
    </aside>
  );
}
