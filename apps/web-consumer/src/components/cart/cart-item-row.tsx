'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatSom } from '@/lib/format';
import type { CartItem } from '@/stores/cart';

type Props = {
  item: CartItem;
  labels: {
    increase: string;
    decrease: string;
    remove: string;
  };
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
};

/**
 * One row in the cart list. Shows emoji avatar + name + (optional notes) +
 * line total + quantity controls + remove button.
 */
export function CartItemRow({ item, labels, onIncrement, onDecrement, onRemove }: Props) {
  const lineTotal = item.priceMinor * item.quantity;

  return (
    <div className="flex items-start gap-4 border-b border-neutral-100 px-4 py-4 last:border-0 sm:px-5">
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${item.bgColor}`}
        aria-hidden="true"
      >
        <span className="text-3xl">{item.emoji}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="line-clamp-2 text-sm font-bold text-neutral-900 sm:text-base">
          {item.name}
        </h4>
        {item.notes ? <p className="line-clamp-2 text-xs text-neutral-500">{item.notes}</p> : null}
        <p className="mt-1 text-sm font-bold text-neutral-900">{formatSom(lineTotal)}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-neutral-400 transition hover:text-danger"
          aria-label={labels.remove}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 rounded-full bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => onDecrement(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            aria-label={labels.decrease}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-5 text-center text-sm font-bold tabular-nums text-neutral-900">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onIncrement(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600"
            aria-label={labels.increase}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
