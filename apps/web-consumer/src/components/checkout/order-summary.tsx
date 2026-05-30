'use client';

import { useTranslations } from 'next-intl';
import { formatSom } from '@/lib/format';
import type { CartAmounts } from '@/lib/cart-fees';
import type { CartItem } from '@/stores/cart';

type Props = {
  items: CartItem[];
  amounts: CartAmounts;
};

/**
 * Compact "review your order" panel for the checkout page. Lists each
 * cart item with quantity + line total, then breaks down subtotal /
 * delivery / service / total. Sits inside a softly-tinted neutral card so
 * it visually reads as a summary, not a form.
 */
export function CheckoutOrderSummary({ items, amounts }: Props) {
  const t = useTranslations('checkout');
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <section className="rounded-3xl bg-neutral-50 p-5 sm:p-6">
      <h3 className="font-display text-lg font-extrabold text-neutral-900">
        {t('summary_title')}
      </h3>

      <p className="mt-1 text-xs text-neutral-500">
        {t('summary_items', { count: totalQuantity })}
      </p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-base" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="truncate text-neutral-700">
                {item.name}{' '}
                <span className="text-neutral-400">× {item.quantity}</span>
              </span>
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-neutral-900">
              {formatSom(item.priceMinor * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="my-4 h-px bg-neutral-200" aria-hidden="true" />

      <dl className="flex flex-col gap-2 text-sm">
        <Row label={t('summary_subtotal')} value={formatSom(amounts.subtotal)} />
        <Row
          label={t('summary_delivery')}
          value={amounts.deliveryFee === 0 ? t('summary_free') : formatSom(amounts.deliveryFee)}
          accent={amounts.deliveryFee === 0 ? 'mint' : undefined}
        />
        <Row label={t('summary_service')} value={formatSom(amounts.serviceFee)} />
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
        <span className="text-base font-bold text-neutral-900">{t('summary_total')}</span>
        <span className="font-display text-2xl font-extrabold text-neutral-900">
          {formatSom(amounts.total)}
        </span>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'mint';
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd
        className={`font-semibold tabular-nums ${
          accent === 'mint' ? 'text-mint-600' : 'text-neutral-900'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
