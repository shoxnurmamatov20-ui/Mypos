'use client';

import { Check } from 'lucide-react';
import type { DeliveryAddress } from '@/stores/checkout';

type Props = {
  address: DeliveryAddress;
  selected: boolean;
  onSelect: (id: string) => void;
};

/**
 * Radio-style card for one delivery address. Visual selection state is
 * driven by `selected` — the parent owns the radio group.
 */
export function AddressCard({ address, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(address.id)}
      aria-pressed={selected}
      className={`relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
        selected
          ? 'border-brand-500 bg-brand-50/50 shadow-sm'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
      }`}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100"
        aria-hidden="true"
      >
        <span className="text-2xl">{address.emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-neutral-900 sm:text-base">{address.label}</h4>
        <p className="mt-0.5 truncate text-sm text-neutral-700">{address.street}</p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">{address.city}</p>
        {address.apartment ? (
          <p className="mt-0.5 truncate text-xs text-neutral-500">{address.apartment}</p>
        ) : null}
      </div>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          selected ? 'border-brand-500 bg-brand-500' : 'border-neutral-300 bg-white'
        }`}
        aria-hidden="true"
      >
        {selected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
      </span>
    </button>
  );
}
