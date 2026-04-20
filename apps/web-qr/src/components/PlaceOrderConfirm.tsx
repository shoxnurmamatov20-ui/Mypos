'use client';

import { CheckCircle2 } from 'lucide-react';
import { type Locale, translate } from '@/lib/i18n';

type Props = {
  orderNo: string;
  locale: Locale;
  onBack: () => void;
};

export function PlaceOrderConfirm({ orderNo, locale, onBack }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-center">
      <CheckCircle2 className="mb-4 h-20 w-20 text-mint-500" />
      <h2 className="font-display text-2xl font-bold text-neutral-900">
        {translate(locale, 'order.success.title')}
      </h2>
      <p className="mt-2 text-neutral-600">
        {translate(locale, 'order.success.number')}
      </p>
      <p className="mt-1 text-3xl font-bold text-brand-600">{orderNo}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-8 flex min-h-14 min-w-60 items-center justify-center rounded-2xl bg-brand-500 px-6 text-base font-bold text-white shadow transition hover:bg-brand-600"
      >
        {translate(locale, 'order.success.back')}
      </button>
    </div>
  );
}
