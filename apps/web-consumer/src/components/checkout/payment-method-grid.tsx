'use client';

import { Banknote, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '@/stores/checkout';

type Props = {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  labels: Record<PaymentMethod, string>;
};

type Tile = {
  id: PaymentMethod;
  emoji?: string;
  icon?: typeof Banknote;
  accent: string;
};

const TILES: Tile[] = [
  { id: 'cash', icon: Banknote, accent: 'bg-mint-100 text-mint-700' },
  { id: 'click', emoji: '⚡', accent: 'bg-blue-100 text-blue-700' },
  { id: 'payme', emoji: '💸', accent: 'bg-emerald-100 text-emerald-700' },
  { id: 'card', icon: CreditCard, accent: 'bg-purple-50 text-purple-700' },
];

/**
 * 2x2 grid of payment-method tiles. The visual states are intentionally
 * loud (border + bg shift) because this is the most action-heavy decision
 * on the checkout page.
 */
export function PaymentMethodGrid({ selected, onSelect, labels }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TILES.map((tile) => {
        const isActive = selected === tile.id;
        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => onSelect(tile.id)}
            aria-pressed={isActive}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
              isActive
                ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tile.accent}`}
              aria-hidden="true"
            >
              {tile.icon ? (
                <tile.icon className="h-6 w-6" />
              ) : (
                <span className="text-2xl">{tile.emoji}</span>
              )}
            </span>
            <span
              className={`text-sm font-bold ${isActive ? 'text-brand-700' : 'text-neutral-900'}`}
            >
              {labels[tile.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
