import { Bike, Clock, Star } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { getCuisineBg, type Restaurant } from '@/data/restaurants';

export type RestaurantCardVariant = 'horizontal' | 'vertical' | 'compact';

type RestaurantCardProps = {
  restaurant: Restaurant;
  variant: RestaurantCardVariant;
  locale: 'uz' | 'ru' | 'en';
  /** Localized labels passed in by the caller (server-rendered i18n). */
  labels: {
    minutes: string; // "{n} daq" already formatted
    free: string;
    closed: string;
    soum: string; // "so'm"
  };
};

/**
 * Reusable restaurant card.
 *
 * Why three variants? Home + search reuse the same data shape but need
 * different geometry — a 288px snap-row tile, a fluid grid tile, and a
 * compact list row. Keeping them in one component avoids duplicated
 * Tailwind class strings and keeps the JIT scanner happy.
 */
export function RestaurantCard({ restaurant, variant, locale, labels }: RestaurantCardProps) {
  const href = `/${locale}/restaurants/${restaurant.slug}` as Route;
  const bg = getCuisineBg(restaurant.cuisine);
  const cuisine = restaurant.cuisineLabel[locale];
  const deliveryFeeLabel =
    restaurant.deliveryFee === 0
      ? labels.free
      : `${restaurant.deliveryFee.toLocaleString('ru-RU')} ${labels.soum}`;
  const minutesLabel = labels.minutes.replace('{minutes}', String(restaurant.deliveryMinutes));

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="flex h-24 w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:shadow-md active:opacity-80"
      >
        <div
          className={`relative flex h-18 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl ${bg}`}
          style={{ height: 72 }}
        >
          <span className="text-4xl" aria-hidden="true">
            {restaurant.imageEmoji}
          </span>
          {!restaurant.isOpen ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-bold text-white">
              {labels.closed}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-neutral-900">{restaurant.name}</h3>
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-neutral-700">
              <Star className="h-3 w-3 fill-gold-500 text-gold-500" aria-hidden="true" />
              {restaurant.rating.toFixed(1)}
            </span>
          </div>
          <p className="truncate text-xs text-neutral-500">{cuisine}</p>
          <div className="mt-auto flex items-center gap-3 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {minutesLabel}
            </span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                restaurant.deliveryFee === 0 ? 'text-mint-600' : 'text-neutral-600'
              }`}
            >
              <Bike className="h-3 w-3" aria-hidden="true" />
              {deliveryFeeLabel}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal + vertical share the same anatomy but differ in width and image height.
  const wrapperClass =
    variant === 'horizontal'
      ? 'block w-72 shrink-0 snap-start active:opacity-80 hover:shadow-lg transition rounded-3xl bg-white border border-neutral-200 overflow-hidden'
      : 'group block w-full active:opacity-80 hover:shadow-xl transition rounded-3xl bg-white border border-neutral-200 overflow-hidden';

  const imageClass =
    variant === 'horizontal'
      ? `relative flex h-44 items-center justify-center ${bg}`
      : `relative flex h-48 items-center justify-center ${bg}`;

  return (
    <Link href={href} className={wrapperClass}>
      <div className={imageClass}>
        <span className="text-7xl transition group-hover:scale-110" aria-hidden="true">
          {restaurant.imageEmoji}
        </span>

        {restaurant.promotion ? (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-md">
            {restaurant.promotion}
          </span>
        ) : null}

        {!restaurant.isOpen ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
            {labels.closed}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 flex-1 text-base font-bold text-neutral-900">
            {restaurant.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-neutral-800">
            <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" aria-hidden="true" />
            {restaurant.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">{cuisine}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {minutesLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              restaurant.deliveryFee === 0 ? 'font-bold text-mint-600' : 'text-neutral-600'
            }`}
          >
            <Bike className="h-3.5 w-3.5" aria-hidden="true" />
            {deliveryFeeLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
