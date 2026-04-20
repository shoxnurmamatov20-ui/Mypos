'use client';

import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError, publicApi } from '@mypos/api-client';
import { formatMoney, type Currency, type Locale as UtilsLocale } from '@mypos/utils';
import { type Locale, translate } from '@/lib/i18n';
import { apiClient } from '@/lib/api';
import { useCartStore } from '@/stores/cart';

type Props = {
  open: boolean;
  onClose: () => void;
  slug: string;
  tableId: string;
  locale: Locale;
  currency: string;
  onPlaced: (orderNo: string) => void;
};

export function CartModal({
  open,
  onClose,
  slug,
  tableId,
  locale,
  currency,
  onPlaced,
}: Props) {
  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.incrementQty);
  const decrement = useCartStore((s) => s.decrementQty);
  const remove = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const clear = useCartStore((s) => s.clear);

  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const place = useMutation({
    mutationFn: async () => {
      const result = await publicApi.orders.place(apiClient, slug, {
        tableId,
        notes: notes.trim() === '' ? null : notes.trim(),
        items: items.map((it) => ({ menu_item_id: it.id, quantity: it.qty })),
      });
      return result.data;
    },
    onSuccess: (order) => {
      clear();
      setNotes('');
      onPlaced(order.order_no);
    },
    onError: (err: unknown) => {
      let msg = translate(locale, 'order.error');
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as { message?: string };
        if (typeof body.message === 'string' && body.message.length > 0) {
          msg = body.message;
        }
      }
      setErrorMsg(msg);
    },
  });

  if (!open) return null;

  const utilsLocale: UtilsLocale = locale;
  const cur = (currency || 'UZS') as Currency;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="font-display text-xl font-bold">
          {translate(locale, 'cart.title')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={translate(locale, 'cart.close')}
          className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <p className="mt-10 text-center text-neutral-500">
            {translate(locale, 'cart.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-400">
                      🍽️
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{it.name}</p>
                  <p className="text-sm text-brand-600">
                    {formatMoney(it.price, cur, utilsLocale)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => decrement(it.id)}
                    aria-label="-"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{it.qty}</span>
                  <button
                    type="button"
                    onClick={() => increment(it.id)}
                    aria-label="+"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    aria-label={translate(locale, 'cart.item.remove')}
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            <li>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={translate(locale, 'cart.notesPlaceholder')}
                className="mt-2 w-full resize-none rounded-xl border border-neutral-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </li>
          </ul>
        )}
        {errorMsg ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {errorMsg}
          </p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <footer className="border-t border-neutral-200 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-center justify-between text-lg">
            <span className="text-neutral-600">{translate(locale, 'cart.subtotal')}</span>
            <span className="font-bold">{formatMoney(subtotal, cur, utilsLocale)}</span>
          </div>
          <button
            type="button"
            onClick={() => place.mutate()}
            disabled={place.isPending}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-brand-500 text-base font-bold text-white shadow transition hover:bg-brand-600 disabled:opacity-60"
          >
            {place.isPending
              ? translate(locale, 'cart.placing')
              : translate(locale, 'cart.place')}
          </button>
        </footer>
      ) : null}
    </div>
  );
}
