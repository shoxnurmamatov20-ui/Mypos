'use client';

import { Plus } from 'lucide-react';
import type { PublicMenuItem } from '@mypos/api-client';
import { formatMoney, type Currency, type Locale as UtilsLocale } from '@mypos/utils';
import { type Locale, pickTranslation, translate } from '@/lib/i18n';

type Props = {
  item: PublicMenuItem;
  locale: Locale;
  currency: string;
  onAdd?: (item: PublicMenuItem) => void;
  disableAdd?: boolean;
};

export function MenuItemCard({ item, locale, currency, onAdd, disableAdd }: Props) {
  const name = pickTranslation(item.name, locale);
  const description = pickTranslation(item.description ?? null, locale);
  const price = item.price.effective_amount;
  const utilsLocale: UtilsLocale = locale;
  const cur = (currency || item.price.currency || 'UZS') as Currency;

  return (
    <article className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        {item.thumbnail_url || item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url ?? item.image_url ?? ''}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-400">
            🍽️
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight text-neutral-900">
            {name}
          </h3>
          {description ? (
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-semibold text-brand-600">
            {formatMoney(price, cur, utilsLocale)}
          </span>
          {onAdd ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              disabled={disableAdd}
              aria-label={translate(locale, 'item.add')}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow transition hover:bg-brand-600 disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
