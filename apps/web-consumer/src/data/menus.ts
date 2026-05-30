/**
 * Menu UI types + colour palette.
 *
 * Previously this file shipped a hand-curated `MOCK_MENUS` map. Live menu
 * data now comes from `/api/v1/public/menu/{slug}` — see
 * `lib/public-api.ts` and the `publicMenuToUi` mapper. The types and
 * palette helpers below are still useful: they describe the UI contract
 * the components render against and pin every Tailwind colour literal so
 * the JIT scanner picks them up.
 */

export type MockMenuItem = {
  id: string;
  categoryId: string;
  name: { uz: string; ru: string; en: string };
  description: { uz: string; ru: string; en: string };
  /** Price in so'm (UZS, no fractional units). */
  priceMinor: number;
  emoji: string;
  bgColor: 'amber' | 'red' | 'yellow' | 'pink' | 'purple' | 'emerald' | 'blue' | 'orange';
  isPopular: boolean;
  isNew: boolean;
  preparationMinutes: number;
};

export type MockMenuCategory = {
  id: string;
  name: { uz: string; ru: string; en: string };
  emoji: string;
};

export type MockRestaurantMenu = {
  categories: MockMenuCategory[];
  items: MockMenuItem[];
};

/**
 * Map item bgColor enum → Tailwind utility class.
 *
 * The JIT scanner only sees classes that appear as literal strings in
 * source. Listing them all in one switch keeps the scanner happy.
 */
export function getItemBgClass(color: MockMenuItem['bgColor']): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-100';
    case 'red':
      return 'bg-red-100';
    case 'yellow':
      return 'bg-yellow-100';
    case 'pink':
      return 'bg-pink-100';
    case 'purple':
      return 'bg-purple-100';
    case 'emerald':
      return 'bg-emerald-100';
    case 'blue':
      return 'bg-blue-100';
    case 'orange':
      return 'bg-orange-100';
  }
}
