'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicMenuResponse } from '@mypos/api-client';
import { apiClient } from '@/lib/api';
import {
  normalizeLocale,
  pickTranslation,
  translate,
  type Locale,
} from '@/lib/i18n';
import { useCartStore } from '@/stores/cart';
import { Cart } from './Cart';
import { CartModal } from './CartModal';
import { MenuCategoryTabs } from './MenuCategoryTabs';
import { type DietaryTag, MenuFilters } from './MenuFilters';
import { MenuItemCard } from './MenuItemCard';
import { PlaceOrderConfirm } from './PlaceOrderConfirm';

type Props = {
  slug: string;
  tableId?: string;
};

export function MenuView({ slug, tableId }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placedOrderNo, setPlacedOrderNo] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState<Set<DietaryTag>>(new Set());
  const [overrideLocale, setOverrideLocale] = useState<Locale | null>(null);

  const setTenantSlug = useCartStore((s) => s.setTenantSlug);

  useEffect(() => {
    setTenantSlug(slug);
  }, [slug, setTenantSlug]);

  const menuQuery = useQuery<PublicMenuResponse>({
    queryKey: ['public-menu', slug],
    queryFn: () => publicApi.menu.get(apiClient, slug),
  });

  const tenantLocale: Locale = normalizeLocale(menuQuery.data?.data.tenant.default_locale);
  const locale: Locale = overrideLocale ?? tenantLocale;
  const currency = menuQuery.data?.data.tenant.default_currency ?? 'UZS';

  const filteredItems = useMemo(() => {
    const all = menuQuery.data?.data.items ?? [];
    let result = activeCategoryId === null ? all : all.filter((it) => it.category_id === activeCategoryId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((it) => {
        const name = pickTranslation(it.name, locale).toLowerCase();
        const desc = it.description ? pickTranslation(it.description, locale).toLowerCase() : '';
        return name.includes(q) || desc.includes(q);
      });
    }

    if (tags.size > 0) {
      result = result.filter((it) => {
        const itemTags = new Set<string>([...(it.tags ?? []), ...(it.allergens ?? [])]);
        for (const tag of tags) {
          if (itemTags.has(tag)) return true;
        }
        return false;
      });
    }

    return result;
  }, [menuQuery.data, activeCategoryId, search, tags, locale]);

  if (menuQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">{translate('uz', 'menu.loading')}</p>
      </main>
    );
  }

  if (menuQuery.isError || !menuQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-danger">{translate('uz', 'menu.error')}</p>
      </main>
    );
  }

  const { tenant, categories } = menuQuery.data.data;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col pb-32">
      <header className="bg-gradient-to-br from-brand-500 to-brand-600 px-4 pb-6 pt-8 text-white">
        <div className="flex items-center gap-3">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-14 w-14 rounded-full bg-white object-cover p-1"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl">
              🍽️
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold">{tenant.name}</h1>
          </div>
        </div>
        {tableId ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            <span>{translate(locale, 'menu.table')}:</span>
            <span className="font-bold">{tableId.slice(0, 8)}</span>
          </div>
        ) : null}
      </header>

      <section className="px-4">
        <MenuFilters
          locale={locale}
          onLocaleChange={setOverrideLocale}
          search={search}
          onSearchChange={setSearch}
          activeTags={tags}
          onTagsChange={setTags}
        />

        <MenuCategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
          locale={locale}
        />

        <div className="mt-4 flex flex-col gap-3">
          {filteredItems.length === 0 ? (
            <p className="py-10 text-center text-neutral-500">
              {translate(locale, 'menu.noItems')}
            </p>
          ) : (
            filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                locale={locale}
                currency={currency}
                onAdd={
                  tableId
                    ? (i) =>
                        useCartStore.getState().addItem({
                          id: i.id,
                          name: pickTranslation(i.name, locale),
                          price: i.price.effective_amount,
                          image_url: i.thumbnail_url ?? i.image_url,
                        })
                    : undefined
                }
              />
            ))
          )}
        </div>
      </section>

      {tableId ? (
        <>
          <Cart
            locale={locale}
            currency={currency}
            onOpen={() => setCartOpen(true)}
          />
          <CartModal
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            slug={slug}
            tableId={tableId}
            locale={locale}
            currency={currency}
            onPlaced={(orderNo) => {
              setCartOpen(false);
              setPlacedOrderNo(orderNo);
            }}
          />
          {placedOrderNo ? (
            <PlaceOrderConfirm
              orderNo={placedOrderNo}
              locale={locale}
              onBack={() => setPlacedOrderNo(null)}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
