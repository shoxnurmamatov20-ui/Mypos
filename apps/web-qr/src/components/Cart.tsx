'use client';

import { ShoppingBag } from 'lucide-react';
import { formatMoney, type Currency, type Locale as UtilsLocale } from '@mypos/utils';
import { type Locale, translate } from '@/lib/i18n';
import { useCartStore } from '@/stores/cart';

type Props = {
  locale: Locale;
  currency: string;
  onOpen: () => void;
};

export function Cart({ locale, currency, onOpen }: Props) {
  const count = useCartStore((s) => s.totalCount());
  const subtotal = useCartStore((s) => s.subtotal());

  if (count === 0) return null;

  const utilsLocale: UtilsLocale = locale;
  const cur = (currency || 'UZS') as Currency;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={translate(locale, 'cart.openLabel')}
        className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-500 px-5 py-4 text-white shadow-lg transition hover:bg-brand-600"
      >
        <span className="flex items-center gap-3">
          <span className="relative">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand-600">
              {count}
            </span>
          </span>
          <span className="font-semibold">{translate(locale, 'cart.title')}</span>
        </span>
        <span className="font-bold">{formatMoney(subtotal, cur, utilsLocale)}</span>
      </button>
    </div>
  );
}
