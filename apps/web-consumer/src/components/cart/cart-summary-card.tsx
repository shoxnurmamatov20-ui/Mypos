'use client';

import { useTranslations } from 'next-intl';
import type { CartAmounts } from '@/lib/cart-fees';
import { formatSom } from '@/lib/format';

type Props = {
  amounts: CartAmounts;
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  variant: 'cart' | 'checkout';
};

/**
 * Sticky order-summary card used by both the cart page (right rail) and
 * the checkout page (review section). Wraps subtotal / delivery / service
 * rows + a primary CTA button.
 */
export function CartSummaryCard({ amounts, primaryAction, variant }: Props) {
  const t = useTranslations(variant === 'cart' ? 'cart_page' : 'checkout');

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-lg font-extrabold text-neutral-900">{t('summary_title')}</h3>

      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <SummaryRow label={t('summary_subtotal')} value={formatSom(amounts.subtotal)} />
        <SummaryRow
          label={t('summary_delivery')}
          value={amounts.deliveryFee === 0 ? t('summary_free') : formatSom(amounts.deliveryFee)}
          accent={amounts.deliveryFee === 0 ? 'mint' : undefined}
        />
        <SummaryRow label={t('summary_service')} value={formatSom(amounts.serviceFee)} />
      </dl>

      <div className="my-4 h-px bg-neutral-200" aria-hidden="true" />

      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-neutral-900">{t('summary_total')}</span>
        <span className="font-display text-2xl font-extrabold text-neutral-900">
          {formatSom(amounts.total)}
        </span>
      </div>

      <button
        type="button"
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand-500 text-base font-bold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {primaryAction.label}
      </button>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: 'mint' }) {
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
