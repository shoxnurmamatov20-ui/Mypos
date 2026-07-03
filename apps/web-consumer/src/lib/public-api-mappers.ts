/**
 * Mappers — public API responses → UI shapes.
 *
 * The pages/components were originally written against `MOCK_RESTAURANTS`
 * and `MOCK_MENUS`. To keep the diff small while we wire up the real API
 * we map each `PublicRestaurant` / `PublicMenuItemResponse` back into the
 * legacy `Restaurant` / `MockMenuItem` shapes. As the SDK matures we'll
 * inline these reads in the components and drop the mappers.
 *
 * Localised display names — the API returns `name: { uz, ru, en }`. We
 * resolve to the active locale here so consumers don't need to know
 * about the i18n shape.
 */

import type { MockMenuCategory, MockMenuItem, MockRestaurantMenu } from '@/data/menus';
import type { Restaurant } from '@/data/restaurants';
import {
  type PublicLocale,
  type PublicMenuCategoryResponse,
  type PublicMenuItemResponse,
  type PublicMenuResponse,
  type PublicRestaurant,
  pickTranslation,
} from './public-api';

/** Convert a PublicRestaurant + active locale into the legacy Restaurant shape. */
export function publicRestaurantToUi(source: PublicRestaurant, locale: PublicLocale): Restaurant {
  return {
    id: source.id,
    slug: source.slug,
    name: pickTranslation(source.name, locale),
    cuisine: source.cuisine,
    cuisineLabel: source.cuisine_label,
    // Front-end still uses emoji as a fallback hero artwork. The real
    // logo / cover URLs are kept on the API response for when components
    // upgrade to <Image>.
    imageEmoji: cuisineEmoji(source.cuisine),
    rating: source.rating,
    reviewCount: source.review_count,
    deliveryMinutes: source.delivery_minutes,
    deliveryFee: source.delivery_fee,
    minOrderAmount: source.min_order_amount,
    isFeatured: source.is_featured,
    isOpen: source.is_open,
    promotion: source.promotion ?? undefined,
  };
}

/** Convenience for batch transforms. */
export function publicRestaurantsToUi(
  list: PublicRestaurant[],
  locale: PublicLocale,
): Restaurant[] {
  return list.map((r) => publicRestaurantToUi(r, locale));
}

export function publicMenuCategoryToUi(source: PublicMenuCategoryResponse): MockMenuCategory {
  return {
    id: source.id,
    name: source.name,
    emoji: source.emoji,
  };
}

export function publicMenuItemToUi(source: PublicMenuItemResponse): MockMenuItem {
  return {
    id: source.id,
    categoryId: source.category_id,
    name: source.name,
    description: source.description ?? { uz: '', ru: '', en: '' },
    priceMinor: source.price_minor,
    emoji: source.emoji,
    bgColor: source.bg_color,
    isPopular: source.is_popular,
    isNew: source.is_new,
    preparationMinutes: source.preparation_minutes,
  };
}

export function publicMenuToUi(response: PublicMenuResponse): MockRestaurantMenu {
  return {
    categories: response.data.categories
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(publicMenuCategoryToUi),
    items: response.data.items.map(publicMenuItemToUi),
  };
}

// ------------ Defaults ------------

/**
 * Fallback emoji per cuisine — used until tenants upload a real logo.
 *
 * Tailwind-friendly: stays as a literal map so the bundler can DCE.
 */
function cuisineEmoji(cuisine: PublicRestaurant['cuisine']): string {
  switch (cuisine) {
    case 'uzbek':
      return '🍚';
    case 'pizza':
      return '🍕';
    case 'fast_food':
      return '🍔';
    case 'sushi':
      return '🍣';
    case 'cafe':
      return '☕';
    case 'bakery':
      return '🧁';
    case 'asian':
      return '🍜';
    case 'european':
      return '🥘';
  }
}
