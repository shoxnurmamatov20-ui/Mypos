/**
 * Public consumer API — unauthenticated fetchers for the web-consumer app.
 *
 * Wraps Laravel's `/api/v1/public/*` endpoints. These mirror what Agent B1
 * is building on the backend; once the OpenAPI sync regenerates the SDK
 * the wrappers below will be replaced by `publicApi.*` calls. For now we
 * keep them local so this app is unblocked.
 *
 * Why a thin wrapper instead of `MyPosApiClient`?
 * - Public endpoints don't need auth — keeps Server Components happy
 *   without bringing the auth-token machinery in.
 * - Lets us pin `Accept-Language` per request from the next-intl locale.
 * - Server Components run during static export — `apiClient` from
 *   `lib/api.ts` is `'use client'` and would crash at build time.
 *
 * All helpers are SSR-safe — they `await fetch()` and never touch
 * `window`/`localStorage`.
 */

import type { TranslatedString } from '@mypos/api-client';

// ------------ Configuration ------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:58000';

/** Cache-revalidation window for browse endpoints (60s ISR). */
const DEFAULT_REVALIDATE = 60;

/** Cache-revalidation window for static menu data (5 min). */
const MENU_REVALIDATE = 300;

// ------------ Types (mirror backend response envelopes) ------------

export type PublicLocale = 'uz' | 'ru' | 'en';

export type PublicCuisine =
  | 'uzbek'
  | 'fast_food'
  | 'pizza'
  | 'sushi'
  | 'cafe'
  | 'bakery'
  | 'asian'
  | 'european';

/**
 * Public restaurant projection — what the consumer sees on the marketplace.
 *
 * Backend returns tenant rows enriched with a few computed fields (rating,
 * review_count, delivery_minutes, etc.). The shape here matches the
 * `apps/api` `RestaurantResource` Agent B1 is building.
 */
export type PublicRestaurant = {
  id: string;
  slug: string;
  name: TranslatedString;
  cuisine: PublicCuisine;
  cuisine_label: TranslatedString;
  logo_url: string | null;
  cover_url: string | null;
  rating: number;
  review_count: number;
  delivery_minutes: number;
  delivery_fee: number;
  min_order_amount: number;
  is_featured: boolean;
  is_open: boolean;
  promotion: string | null;
  /** ISO-8601 datetime — last menu update for cache invalidation. */
  updated_at: string;
};

export type PublicMenuItemResponse = {
  id: string;
  category_id: string;
  name: TranslatedString;
  description: TranslatedString | null;
  price_minor: number;
  image_url: string | null;
  emoji: string;
  /** Tailwind colour bucket — backend echoes the colour the merchant picked. */
  bg_color: 'amber' | 'red' | 'yellow' | 'pink' | 'purple' | 'emerald' | 'blue' | 'orange';
  is_popular: boolean;
  is_new: boolean;
  preparation_minutes: number;
};

export type PublicMenuCategoryResponse = {
  id: string;
  name: TranslatedString;
  emoji: string;
  sort_order: number;
};

export type PublicMenuResponse = {
  data: {
    restaurant: PublicRestaurant;
    categories: PublicMenuCategoryResponse[];
    items: PublicMenuItemResponse[];
  };
};

export type PublicRestaurantsListParams = {
  cuisine?: PublicCuisine | 'all';
  q?: string;
  /** `popular` | `delivery_time` | `cheapest` */
  sort?: 'popular' | 'delivery_time' | 'cheapest';
  open_only?: boolean;
  /** Geolocation in `lat,lng` form for nearby ranking. */
  location?: string;
  /** Cursor token from the previous page's `meta.next_cursor`. */
  cursor?: string | null;
  per_page?: number;
};

export type PublicRestaurantsListResponse = {
  data: PublicRestaurant[];
  meta: {
    next_cursor: string | null;
    has_more: boolean;
    total: number;
  };
};

export type PublicRestaurantResponse = { data: PublicRestaurant };

// ------------ Order placement / tracking ------------

export type PublicOrderItemInput = {
  menu_item_id: string;
  quantity: number;
  notes?: string | null;
};

export type PublicOrderInput = {
  restaurant_slug: string;
  items: PublicOrderItemInput[];
  customer: {
    name: string;
    phone: string;
    email?: string | null;
  };
  address: {
    label: string;
    street: string;
    city?: string | null;
    notes?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  payment_method: 'cash' | 'click' | 'payme' | 'card';
  notes?: string | null;
};

export type PublicOrderTrackingStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type PublicOrderTracking = {
  id: string;
  order_no: string;
  tracking_token: string;
  status: PublicOrderTrackingStatus;
  restaurant: { slug: string; name: TranslatedString } | null;
  items: Array<{
    id: string;
    name: TranslatedString;
    quantity: number;
    price_minor: number;
    emoji: string;
  }>;
  amounts: {
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    total: number;
  };
  address: {
    label: string;
    street: string;
  };
  payment_method: 'cash' | 'click' | 'payme' | 'card';
  placed_at: string;
  estimated_delivery_at: string | null;
};

export type PublicOrderResponse = { data: PublicOrderTracking };

// ------------ Error type ------------

export class PublicApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'PublicApiError';
  }
}

// ------------ Internal helpers ------------

type FetcherOptions = {
  /** ISR / cache revalidation window in seconds. Pass `0` to disable. */
  revalidate?: number;
  locale?: PublicLocale;
  /** Skip caching entirely (used for mutations). */
  noStore?: boolean;
};

async function publicFetch<T>(
  path: string,
  init: RequestInit & FetcherOptions = {},
): Promise<T> {
  const { revalidate, locale, noStore, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  headers.set('Accept', 'application/json');
  if (locale) headers.set('Accept-Language', locale);
  if (fetchInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers,
    next: noStore
      ? undefined
      : {
          revalidate: revalidate ?? DEFAULT_REVALIDATE,
          tags: [`public:${path}`],
        },
    cache: noStore ? 'no-store' : undefined,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw new PublicApiError(
      `HTTP ${response.status} on ${path}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&')
  );
}

// ------------ Public API surface ------------

export const publicConsumerApi = {
  restaurants: {
    /** GET /api/v1/public/restaurants — paginated marketplace list. */
    list: (
      params?: PublicRestaurantsListParams,
      options: FetcherOptions = {},
    ) =>
      publicFetch<PublicRestaurantsListResponse>(
        `/api/v1/public/restaurants${buildQuery(params)}`,
        { revalidate: options.revalidate ?? DEFAULT_REVALIDATE, ...options },
      ),

    /** GET /api/v1/public/restaurants/{slug} — single restaurant. */
    bySlug: (slug: string, options: FetcherOptions = {}) =>
      publicFetch<PublicRestaurantResponse>(
        `/api/v1/public/restaurants/${encodeURIComponent(slug)}`,
        { revalidate: options.revalidate ?? DEFAULT_REVALIDATE, ...options },
      ),
  },

  menu: {
    /** GET /api/v1/public/menu/{slug} — public menu (cached server-side). */
    bySlug: (slug: string, options: FetcherOptions = {}) =>
      publicFetch<PublicMenuResponse>(
        `/api/v1/public/menu/${encodeURIComponent(slug)}`,
        { revalidate: options.revalidate ?? MENU_REVALIDATE, ...options },
      ),
  },

  orders: {
    /** POST /api/v1/public/orders — guest checkout. */
    create: (input: PublicOrderInput, options: FetcherOptions = {}) =>
      publicFetch<PublicOrderResponse>('/api/v1/public/orders', {
        method: 'POST',
        body: JSON.stringify(input),
        noStore: true,
        ...options,
      }),

    /** GET /api/v1/public/orders/track/{token} — guest tracking. */
    track: (token: string, options: FetcherOptions = {}) =>
      publicFetch<PublicOrderResponse>(
        `/api/v1/public/orders/track/${encodeURIComponent(token)}`,
        // No ISR — tracking must be fresh.
        { noStore: true, ...options },
      ),
  },
};

// ------------ Locale helpers ------------

const SUPPORTED_LOCALES: readonly PublicLocale[] = ['uz', 'ru', 'en'];

export function isPublicLocale(value: string): value is PublicLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Pick the appropriate translation, falling back across locales. */
export function pickTranslation(
  source: TranslatedString | null | undefined,
  locale: PublicLocale,
): string {
  if (!source) return '';
  return source[locale] || source.uz || source.ru || source.en || '';
}
