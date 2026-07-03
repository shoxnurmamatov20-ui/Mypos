'use client';

import { Loader2, Plus } from 'lucide-react';
import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { AddressCard } from '@/components/checkout/address-card';
import { CheckoutOrderSummary } from '@/components/checkout/order-summary';
import { PaymentMethodGrid } from '@/components/checkout/payment-method-grid';
import { computeCartFees } from '@/lib/cart-fees';
import { formatSom } from '@/lib/format';
import {
  isPublicLocale,
  PublicApiError,
  type PublicOrderInput,
  publicConsumerApi,
} from '@/lib/public-api';
import { saveMockOrder } from '@/lib/save-order';
import { useAuthStore } from '@/stores/auth';
import { selectCartTotal, useCartStore } from '@/stores/cart';
import { type PaymentMethod, selectActiveAddress, useCheckoutStore } from '@/stores/checkout';

/**
 * Checkout page — `/[locale]/checkout`.
 *
 * On submit we:
 *   1. POST to `/api/v1/public/orders` with the cart contents.
 *   2. Persist the response (esp. `tracking_token`) to localStorage so
 *      the success page + tracking views can read it back.
 *   3. Clear the cart and navigate to /order-success/[id].
 *
 * Errors are surfaced as a toast-style banner; the user can retry.
 */
export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const localeFromParams = params?.locale ?? locale;
  const apiLocale = isPublicLocale(locale) ? locale : 'uz';

  const items = useCartStore((s) => s.items);
  const restaurantSlug = useCartStore((s) => s.restaurantSlug);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const subtotal = useCartStore(selectCartTotal);
  const clearCart = useCartStore((s) => s.clear);

  const addresses = useCheckoutStore((s) => s.addresses);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const orderNotes = useCheckoutStore((s) => s.orderNotes);
  const selectAddress = useCheckoutStore((s) => s.selectAddress);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  const setOrderNotes = useCheckoutStore((s) => s.setOrderNotes);
  const activeAddress = useCheckoutStore(selectActiveAddress);

  const authUser = useAuthStore((s) => s.user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressToast, setShowAddressToast] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const amounts = useMemo(() => computeCartFees(subtotal), [subtotal]);

  // Bounce empty carts back to the cart page on mount.
  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      const id = window.setTimeout(() => {
        router.replace(`/${localeFromParams}/cart` as Route);
      }, 500);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [items.length, isSubmitting, router, localeFromParams]);

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: t('payment_cash'),
    click: t('payment_click'),
    payme: t('payment_payme'),
    card: t('payment_card'),
  };

  const handleAddAddress = () => {
    setShowAddressToast(true);
    window.setTimeout(() => setShowAddressToast(false), 2200);
  };

  const handlePlaceOrder = async () => {
    if (!activeAddress || !restaurantSlug || items.length === 0 || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);

    const payload: PublicOrderInput = {
      restaurant_slug: restaurantSlug,
      items: items.map((i) => ({
        menu_item_id: i.id,
        quantity: i.quantity,
        notes: i.notes ?? null,
      })),
      customer: {
        name: authUser?.name ?? 'Guest',
        phone: authUser?.phone ?? '',
      },
      address: {
        label: activeAddress.label,
        street: activeAddress.street,
        city: activeAddress.city ?? null,
        notes: activeAddress.apartment
          ? `${activeAddress.apartment}${activeAddress.notes ? ` — ${activeAddress.notes}` : ''}`
          : (activeAddress.notes ?? null),
      },
      payment_method: paymentMethod,
      notes: orderNotes.trim() ? orderNotes.trim() : null,
    };

    try {
      const { data: created } = await publicConsumerApi.orders.create(payload, {
        locale: apiLocale,
      });

      // Mirror the order into localStorage so the success / orders pages
      // can read it back without an extra round-trip. Once the orders
      // domain is fully wired the saved copy becomes a cache only.
      saveMockOrder({
        id: created.id,
        orderNo: created.order_no,
        restaurantSlug,
        restaurantName,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          priceMinor: i.priceMinor,
          emoji: i.emoji,
        })),
        amounts,
        address: activeAddress,
        paymentMethod,
        notes: orderNotes,
        placedAt: created.placed_at,
        trackingToken: created.tracking_token,
      });

      clearCart();
      router.replace(`/${localeFromParams}/order-success/${created.id}` as Route);
    } catch (error) {
      let message = t('submit_error_generic');
      if (error instanceof PublicApiError) {
        const body = error.body as { message?: string } | undefined;
        if (body?.message) message = body.message;
      }
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" aria-hidden="true" />
        <p className="mt-4 text-sm text-neutral-500">{t('empty_redirect')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
          {t('title')}
        </h1>
        <Stepper labels={[t('step_address'), t('step_payment'), t('step_review')]} />
      </header>

      <div className="mt-8 flex flex-col gap-8">
        {/* SECTION 1 — Address */}
        <section>
          <h2 className="font-display text-lg font-extrabold text-neutral-900 sm:text-xl">
            {t('address_title')}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                selected={address.id === selectedAddressId}
                onSelect={selectAddress}
              />
            ))}
            <button
              type="button"
              onClick={handleAddAddress}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-4 text-sm font-semibold text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('address_add')}
            </button>
          </div>
        </section>

        {/* SECTION 2 — Payment */}
        <section>
          <h2 className="font-display text-lg font-extrabold text-neutral-900 sm:text-xl">
            {t('payment_title')}
          </h2>
          <div className="mt-4">
            <PaymentMethodGrid
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              labels={paymentLabels}
            />
          </div>
        </section>

        {/* SECTION 3 — Notes */}
        <section>
          <h2 className="font-display text-lg font-extrabold text-neutral-900 sm:text-xl">
            {t('notes_title')}
          </h2>
          <textarea
            id="checkout-notes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder={t('notes_placeholder')}
            rows={3}
            className="mt-4 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </section>

        {/* SECTION 4 — Review summary */}
        <CheckoutOrderSummary items={items} amounts={amounts} />

        {submitError ? (
          <div
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger"
          >
            {submitError}
          </div>
        ) : null}
      </div>

      {/* Sticky submit bar (mobile + desktop) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-brand-500 px-5 text-base font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : null}
              {isSubmitting ? t('placing') : t('place_order')}
            </span>
            <span className="font-display text-lg tabular-nums">{formatSom(amounts.total)}</span>
          </button>
        </div>
      </div>

      {/* Coming-soon toast for address creation */}
      {showAddressToast ? (
        <div
          role="status"
          className="fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {t('address_coming_soon')}
        </div>
      ) : null}
    </div>
  );
}

type StepperProps = { labels: [string, string, string] };

function Stepper({ labels }: StepperProps) {
  return (
    <ol className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 sm:gap-3 sm:text-sm">
      {labels.map((label, idx) => (
        <li key={label} className="flex items-center gap-1.5 sm:gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white sm:h-7 sm:w-7 sm:text-xs">
            {idx + 1}
          </span>
          <span className="text-neutral-700">{label}</span>
          {idx < labels.length - 1 ? (
            <span className="ml-1.5 h-px w-4 bg-neutral-300 sm:ml-3 sm:w-8" aria-hidden="true" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
