'use client';

import { getItemBgClass, type MockMenuItem } from '@/data/menus';
import { formatSom } from '@/lib/format';
import { selectItemQuantity, useCartStore } from '@/stores/cart';

type MenuItemCardProps = {
  item: MockMenuItem;
  locale: 'uz' | 'ru' | 'en';
  popularLabel: string;
  newLabel: string;
  onOpen: (item: MockMenuItem) => void;
};

/**
 * Wolt/Glovo-style menu row.
 *
 * Click anywhere opens the detail modal. The cart-quantity badge is
 * driven by the cart selector and re-renders when the user adds the
 * same item from the modal.
 */
export function MenuItemCard({ item, locale, popularLabel, newLabel, onOpen }: MenuItemCardProps) {
  const cartQty = useCartStore(selectItemQuantity(item.id));
  const itemBg = getItemBgClass(item.bgColor);
  const name = item.name[locale];
  const description = item.description[locale];

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:shadow-md"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-1 flex-1 text-base font-bold text-neutral-900">{name}</h3>
          {item.isPopular ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
              {popularLabel}
            </span>
          ) : null}
          {item.isNew ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-mint-100 px-2 py-0.5 text-xs font-bold text-mint-700">
              {newLabel}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="line-clamp-2 text-sm text-neutral-500">{description}</p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-base font-bold text-neutral-900">{formatSom(item.priceMinor)}</span>
        </div>
      </div>

      <div className="relative shrink-0">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-xl ${itemBg} transition group-hover:scale-105`}
        >
          <span className="text-5xl" aria-hidden="true">
            {item.emoji}
          </span>
        </div>
        {cartQty > 0 ? (
          <span className="absolute -bottom-2 -right-2 flex min-w-7 items-center justify-center rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
            {cartQty}
          </span>
        ) : null}
      </div>
    </button>
  );
}
