'use client';

import { ArrowLeft, Bike, Clock, Heart, Share2, Star, Wallet } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MockMenuItem, MockRestaurantMenu } from '@/data/menus';
import { getCuisineBg, type Restaurant } from '@/data/restaurants';
import { formatDeliveryFee, formatSom } from '@/lib/format';
import { ItemDetailModal } from './item-detail-modal';
import { MenuItemCard } from './menu-item-card';
import { RestaurantCartPanel } from './restaurant-cart-panel';

type RestaurantDetailProps = {
  restaurant: Restaurant;
  /**
   * Server-rendered menu — passed in so the page is fully populated on
   * first paint. The component no longer reaches into a mock store.
   */
  menu: MockRestaurantMenu;
  locale: 'uz' | 'ru' | 'en';
};

/**
 * Wide restaurant detail page — hero + sticky stats + sticky category nav
 * + scrollable menu sections + sticky cart rail on desktop.
 */
export function RestaurantDetail({ restaurant, menu, locale }: RestaurantDetailProps) {
  const t = useTranslations('restaurant_detail');

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    menu.categories[0]?.id ?? null,
  );
  const [openItem, setOpenItem] = useState<MockMenuItem | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Hydrate favourite state from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mypos_consumer_favorites');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      setIsFavorite(list.includes(restaurant.slug));
    } catch {
      // ignore corrupt storage
    }
  }, [restaurant.slug]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem('mypos_consumer_favorites');
        const list = raw ? (JSON.parse(raw) as string[]) : [];
        const updated = next
          ? Array.from(new Set([...list, restaurant.slug]))
          : list.filter((s) => s !== restaurant.slug);
        localStorage.setItem('mypos_consumer_favorites', JSON.stringify(updated));
      } catch {
        // ignore quota / parse errors
      }
      return next;
    });
  }, [restaurant.slug]);

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: restaurant.name, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }, [restaurant.name]);

  // Section refs for smooth-scroll on category chip click.
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategoryId(id);
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 200;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  // Track which category is currently in view as the user scrolls.
  useEffect(() => {
    if (menu.categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const first = visible[0];
        if (first) setActiveCategoryId(first.target.getAttribute('data-category-id'));
      },
      { rootMargin: '-220px 0px -50% 0px', threshold: [0, 0.1, 0.25, 0.5] },
    );
    for (const cat of menu.categories) {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [menu]);

  const cuisineBg = getCuisineBg(restaurant.cuisine);
  const cuisineLabel = restaurant.cuisineLabel[locale];

  const restaurantsHref = `/${locale}/restaurants` as Route;

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className={`relative ${cuisineBg}`}>
        <div className="mx-auto flex h-80 max-w-7xl flex-col justify-end px-4 pb-8 sm:px-6 lg:h-96 lg:px-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-12 top-1/2 hidden -translate-y-1/2 text-[14rem] leading-none drop-shadow-md lg:block"
          >
            {restaurant.imageEmoji}
          </span>

          <Link
            href={restaurantsHref}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-neutral-800 backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('back')}
          </Link>

          <h1 className="font-display text-4xl font-extrabold text-white drop-shadow-lg sm:text-5xl lg:text-7xl">
            {restaurant.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-semibold text-white/95 drop-shadow lg:text-lg">
            <span>{cuisineLabel}</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-gold-500 text-gold-500" aria-hidden="true" />
              {restaurant.rating.toFixed(1)}
            </span>
            <span className="text-white/80">
              {t('rating_reviews', { count: restaurant.reviewCount })}
            </span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="sticky top-16 z-30 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          <Stat
            icon={<Clock className="h-4 w-4 text-neutral-700" aria-hidden="true" />}
            value={`${restaurant.deliveryMinutes} ${t('minutes_short')}`}
            label={t('delivery_time')}
          />
          <Stat
            icon={<Bike className="h-4 w-4 text-neutral-700" aria-hidden="true" />}
            value={
              restaurant.deliveryFee === 0
                ? formatDeliveryFee(0)
                : formatDeliveryFee(restaurant.deliveryFee)
            }
            label={t('delivery_fee')}
            valueClass={restaurant.deliveryFee === 0 ? 'text-mint-600' : 'text-neutral-900'}
          />
          <Stat
            icon={<Wallet className="h-4 w-4 text-neutral-700" aria-hidden="true" />}
            value={formatSom(restaurant.minOrderAmount)}
            label={t('min_order')}
          />
          <Stat
            icon={<Star className="h-4 w-4 fill-gold-500 text-gold-500" aria-hidden="true" />}
            value={`${restaurant.rating.toFixed(1)} (${restaurant.reviewCount})`}
            label={t('rating_label')}
          />

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              aria-label={t('favorite')}
              className={
                isFavorite
                  ? 'flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition hover:bg-brand-100'
                  : 'flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50'
              }
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-brand-500' : ''}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label={t('share')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50"
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-9">
          {menu.categories.length > 0 ? (
            <>
              {/* Sticky category nav */}
              <div className="sticky top-32 z-20 -mx-4 border-b border-neutral-200 bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0">
                <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                  <div className="flex min-w-max items-center gap-2">
                    {menu.categories.map((cat) => {
                      const isActive = cat.id === activeCategoryId;
                      const count = menu.items.filter((i) => i.categoryId === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => scrollToCategory(cat.id)}
                          aria-pressed={isActive}
                          className={
                            isActive
                              ? 'inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-bold text-white transition'
                              : 'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50'
                          }
                        >
                          <span aria-hidden="true">{cat.emoji}</span>
                          <span>{cat.name[locale]}</span>
                          <span className={isActive ? 'text-white/80' : 'text-neutral-400'}>
                            ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Menu sections */}
              <div className="mt-6 flex flex-col gap-10">
                {menu.categories.map((cat) => {
                  const items = menu.items.filter((i) => i.categoryId === cat.id);
                  if (items.length === 0) return null;
                  return (
                    <section
                      key={cat.id}
                      ref={(el) => {
                        sectionRefs.current[cat.id] = el;
                      }}
                      data-category-id={cat.id}
                      className="scroll-mt-48"
                    >
                      <div className="mb-4 flex items-baseline gap-2">
                        <span className="text-2xl" aria-hidden="true">
                          {cat.emoji}
                        </span>
                        <h2 className="font-display text-2xl font-extrabold text-neutral-900">
                          {cat.name[locale]}
                        </h2>
                        <span className="text-sm font-semibold text-neutral-400">
                          {t('items_count', { count: items.length })}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {items.map((mi) => (
                          <MenuItemCard
                            key={mi.id}
                            item={mi}
                            locale={locale}
                            popularLabel={t('popular')}
                            newLabel={t('new')}
                            onOpen={setOpenItem}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-20 text-center">
              <span className="text-9xl opacity-30" aria-hidden="true">
                🍽️
              </span>
              <h2 className="font-display text-2xl font-bold text-neutral-900">
                {t('menu_empty_title')}
              </h2>
              <p className="max-w-md text-sm text-neutral-500">{t('menu_empty_hint')}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-32">
            <RestaurantCartPanel restaurantSlug={restaurant.slug} locale={locale} />
          </div>
        </div>
      </div>

      <ItemDetailModal
        item={openItem}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        locale={locale}
        onClose={() => setOpenItem(null)}
      />
    </div>
  );
}

// ------------ Local helpers ------------

type StatProps = {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueClass?: string;
};

function Stat({ icon, value, label, valueClass }: StatProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100"
      >
        {icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span className={`text-sm font-extrabold ${valueClass ?? 'text-neutral-900'}`}>
          {value}
        </span>
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
    </div>
  );
}
