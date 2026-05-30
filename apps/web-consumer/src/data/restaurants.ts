/**
 * Restaurant UI types + cuisine palette.
 *
 * Previously this file shipped a hand-curated `MOCK_RESTAURANTS` array.
 * Live data now comes from `/api/v1/public/restaurants` — see
 * `lib/public-api.ts` and the `publicRestaurantToUi` mapper. The types
 * and palette helpers below are still useful: they describe the UI
 * contract the components render against and pin every Tailwind colour
 * literal so the JIT scanner picks them up.
 */

export type RestaurantCuisine =
  | 'uzbek'
  | 'fast_food'
  | 'pizza'
  | 'sushi'
  | 'cafe'
  | 'bakery'
  | 'asian'
  | 'european';

export type LocalizedLabel = {
  uz: string;
  ru: string;
  en: string;
};

/**
 * UI projection of a restaurant — produced by `publicRestaurantToUi()`.
 *
 * Pricing is in integer so'm (UZS, no fractional units). `name` is
 * already resolved to the active locale by the mapper; `cuisineLabel`
 * keeps all three locales because the chip palette switches as the user
 * toggles language.
 */
export type Restaurant = {
  id: string;
  slug: string;
  /** Already localised by the mapper. */
  name: string;
  cuisine: RestaurantCuisine;
  cuisineLabel: LocalizedLabel;
  /** Fallback hero artwork until the merchant uploads a real logo. */
  imageEmoji: string;
  rating: number;
  reviewCount: number;
  deliveryMinutes: number;
  /** Delivery fee in so'm (UZS). 0 means free. */
  deliveryFee: number;
  /** Minimum order amount in so'm. */
  minOrderAmount: number;
  isFeatured: boolean;
  isOpen: boolean;
  /** Optional short promo label, already localized. */
  promotion?: string;
};

/**
 * Map cuisine → Tailwind background utility class.
 *
 * The JIT scanner only sees classes that appear literally in source.
 * Listing them all in a single switch keeps the scanner happy and lets
 * every card / hero share the same colour mapping. Do NOT derive these
 * via string concatenation.
 */
export function getCuisineBg(cuisine: RestaurantCuisine): string {
  switch (cuisine) {
    case 'uzbek':
      return 'bg-amber-100';
    case 'pizza':
      return 'bg-red-100';
    case 'fast_food':
      return 'bg-yellow-100';
    case 'sushi':
      return 'bg-pink-100';
    case 'cafe':
      return 'bg-amber-50';
    case 'bakery':
      return 'bg-purple-100';
    case 'asian':
      return 'bg-emerald-100';
    case 'european':
      return 'bg-blue-100';
  }
}

export type CategoryId = 'all' | RestaurantCuisine;

export type CuisineCategory = {
  id: CategoryId;
  label: LocalizedLabel;
  emoji: string;
};

/**
 * Static cuisine catalogue used by filter chips + category grid. These
 * are UI presets — the backend does not own this list because adding a
 * cuisine requires a coordinated UI/translation/icon change.
 */
export const CUISINE_CATEGORIES: CuisineCategory[] = [
  { id: 'all', label: { uz: 'Hammasi', ru: 'Все', en: 'All' }, emoji: '🍽️' },
  { id: 'uzbek', label: { uz: "O'zbek", ru: 'Узбекская', en: 'Uzbek' }, emoji: '🍚' },
  { id: 'fast_food', label: { uz: 'Fast food', ru: 'Фастфуд', en: 'Fast food' }, emoji: '🍔' },
  { id: 'pizza', label: { uz: 'Pitsa', ru: 'Пицца', en: 'Pizza' }, emoji: '🍕' },
  { id: 'sushi', label: { uz: 'Sushi', ru: 'Суши', en: 'Sushi' }, emoji: '🍣' },
  { id: 'cafe', label: { uz: 'Kafe', ru: 'Кафе', en: 'Cafe' }, emoji: '☕' },
  { id: 'bakery', label: { uz: 'Shirinlik', ru: 'Кондитер', en: 'Bakery' }, emoji: '🧁' },
  { id: 'asian', label: { uz: 'Osiyo', ru: 'Азия', en: 'Asian' }, emoji: '🍜' },
];
