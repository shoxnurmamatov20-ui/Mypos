'use client';

import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { CartEmptyState } from '@/components/cart/cart-empty-state';
import { CartItemRow } from '@/components/cart/cart-item-row';
import { CartSummaryCard } from '@/components/cart/cart-summary-card';
import { computeCartFees } from '@/lib/cart-fees';
import { usePublicRestaurant } from '@/lib/hooks/use-public-restaurants';
import { isPublicLocale } from '@/lib/public-api';
import { publicRestaurantToUi } from '@/lib/public-api-mappers';
import { selectCartTotal, useCartStore } from '@/stores/cart';

/**
 * Cart page — `/[locale]/cart`.
 *
 * Two-column layout on desktop (items + sticky summary), single column on
 * mobile. Empty state when no items. Reads everything from the persisted
 * Zustand cart store, so the server-rendered shell hydrates instantly.
 */
export default function CartPage() {
  const t = useTranslations('cart_page');
  const tHeader = useTranslations('restaurant_card');
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const localeFromParams = params?.locale ?? locale;

  const items = useCartStore((s) => s.items);
  const restaurantSlug = useCartStore((s) => s.restaurantSlug);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const subtotal = useCartStore(selectCartTotal);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const setItemNotes = useCartStore((s) => s.setItemNotes);
  const clear = useCartStore((s) => s.clear);

  // Pull the restaurant header from the public API so the cart page
  // shows the same delivery / cover info as the detail screen.
  const apiLocale = isPublicLocale(locale) ? locale : 'uz';
  const { data: restaurantResponse } = usePublicRestaurant(restaurantSlug);
  const restaurant = useMemo(
    () => (restaurantResponse ? publicRestaurantToUi(restaurantResponse.data, apiLocale) : null),
    [restaurantResponse, apiLocale],
  );

  const amounts = useMemo(() => computeCartFees(subtotal), [subtotal]);

  const handleClear = () => {
    if (typeof window === 'undefined') return;
    if (window.confirm(t('clear_confirm'))) {
      clear();
    }
  };

  const handleCheckout = () => {
    router.push(`/${localeFromParams}/checkout` as Route);
  };

  const goToRestaurantHref = restaurant
    ? (`/${localeFromParams}/restaurants/${restaurant.slug}` as Route)
    : (`/${localeFromParams}` as Route);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
          {t('title')}
        </h1>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('clear')}
          </button>
        ) : null}
      </header>

      {items.length === 0 ? (
        <CartEmptyState locale={localeFromParams} />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* LEFT — items column */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {restaurant && restaurantName ? (
              <Link
                href={goToRestaurantHref}
                className="group flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-4 transition hover:shadow-md sm:p-5"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100"
                  aria-hidden="true"
                >
                  <span className="text-3xl">{restaurant.imageEmoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-neutral-900 sm:text-lg">
                    {restaurantName}
                  </h2>
                  <p className="text-xs text-neutral-500 sm:text-sm">
                    {t('delivery_minutes', { minutes: String(restaurant.deliveryMinutes) })}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-500 transition group-hover:translate-x-0.5">
                  {t('go_to_restaurant')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="font-display text-base font-bold text-neutral-900">
                  {t('items_header')}
                </h3>
                <span className="text-xs text-neutral-500">
                  {t('items_count', { count: items.length })}
                </span>
              </div>

              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  labels={{
                    increase: t('increase'),
                    decrease: t('decrease'),
                    remove: t('remove_item'),
                  }}
                  onIncrement={incrementItem}
                  onDecrement={decrementItem}
                  onRemove={removeItem}
                />
              ))}

              <Link
                href={goToRestaurantHref}
                className="flex items-center justify-center gap-2 border-t border-neutral-100 px-4 py-4 text-sm font-bold text-brand-500 transition hover:bg-brand-50/50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('add_more')}
              </Link>
            </div>

            <CartNotesCard
              items={items}
              setItemNotes={setItemNotes}
              labels={{
                title: t('order_notes'),
                placeholder: t('order_notes_placeholder'),
              }}
            />
          </div>

          {/* RIGHT — sticky summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <CartSummaryCard
                amounts={amounts}
                primaryAction={{
                  label: t('go_to_checkout'),
                  onClick: handleCheckout,
                }}
                variant="cart"
              />
              {amounts.deliveryFee > 0 ? (
                <p className="mt-3 px-1 text-xs text-neutral-500">
                  {tHeader('free')} —{' '}
                  {(100_000 - amounts.subtotal).toLocaleString('ru-RU').replace(/,/g, ' ')}{' '}
                  {tHeader('soum')}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CartNotesCardProps = {
  items: ReturnType<typeof useCartStore.getState>['items'];
  setItemNotes: (id: string, notes: string) => void;
  labels: { title: string; placeholder: string };
};

/**
 * Lets the user attach a free-form note to the **first** cart item — that
 * note then doubles as a generic order note in the absence of a dedicated
 * `orderNotes` field on the cart store. The checkout page has its own,
 * proper `orderNotes` textarea backed by the checkout store.
 */
function CartNotesCard({ items, setItemNotes, labels }: CartNotesCardProps) {
  const firstItem = items[0];
  if (!firstItem) return null;
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5">
      <label htmlFor="cart-notes" className="font-display text-sm font-bold text-neutral-900">
        {labels.title}
      </label>
      <textarea
        id="cart-notes"
        value={firstItem.notes ?? ''}
        onChange={(e) => setItemNotes(firstItem.id, e.target.value)}
        placeholder={labels.placeholder}
        rows={2}
        className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
