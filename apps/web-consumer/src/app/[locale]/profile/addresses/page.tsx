'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { type DeliveryAddress, useCheckoutStore } from '@/stores/checkout';

export default function AddressesPage() {
  const t = useTranslations('addresses_page');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const addresses = useCheckoutStore((s) => s.addresses);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const selectAddress = useCheckoutStore((s) => s.selectAddress);

  const handleAddNew = () => {
    if (typeof window !== 'undefined') {
      window.alert(t('coming_soon'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/${locale}/profile` as Route}
          aria-label={tCommon('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-neutral-900 sm:text-3xl">
          {t('title')}
        </h1>
      </header>

      <ul className="mt-6 flex flex-col gap-3">
        {addresses.map((address) => (
          <li key={address.id}>
            <AddressRow
              address={address}
              isActive={address.id === selectedAddressId}
              selectedLabel={t('selected')}
              selectLabel={t('select')}
              onSelect={() => selectAddress(address.id)}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleAddNew}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-4 py-4 font-semibold text-brand-500 transition hover:border-brand-300 hover:bg-brand-50"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span>{t('add_new')}</span>
      </button>
    </div>
  );
}

type AddressRowProps = {
  address: DeliveryAddress;
  isActive: boolean;
  selectedLabel: string;
  selectLabel: string;
  onSelect: () => void;
};

function AddressRow({ address, isActive, selectedLabel, selectLabel, onSelect }: AddressRowProps) {
  const wrapperClass = isActive
    ? 'flex items-center gap-4 rounded-2xl border-2 border-brand-500 bg-white p-5'
    : 'flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5';

  return (
    <div className={wrapperClass}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl">
        {address.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-neutral-900">{address.label}</p>
          {isActive ? (
            <span className="text-xs font-semibold text-brand-500">✓ {selectedLabel}</span>
          ) : null}
        </div>
        <p className="truncate text-sm text-neutral-500">{address.street}</p>
        {address.apartment ? (
          <p className="truncate text-xs text-neutral-400">{address.apartment}</p>
        ) : null}
      </div>
      {!isActive ? (
        <button
          type="button"
          onClick={onSelect}
          className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-brand-500 transition hover:bg-brand-50"
        >
          {selectLabel}
        </button>
      ) : null}
    </div>
  );
}
