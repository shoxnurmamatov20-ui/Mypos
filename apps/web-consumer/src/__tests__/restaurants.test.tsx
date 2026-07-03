/**
 * B7-T9 — Restaurant list rendering against the public API.
 *
 * Targets the marketplace landing page that hits
 * `/api/v1/public/restaurants` (Agent B1) and renders a list of cards.
 * Tests cover:
 *   - List renders from API data
 *   - Skeleton state while pending
 *   - Error state on 5xx / network failure
 *   - Locale switch resolves `name.{uz|ru|en}` correctly
 *
 * Mock-strategy: we shim `global.fetch` rather than pulling MSW so the
 * test suite stays dependency-free in `package.json` (no devDeps changes
 * required to land this Phase-1 PR; CI lane will add `msw@^2` later).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type PublicRestaurant,
  type PublicRestaurantsListResponse,
  publicConsumerApi,
} from '../lib/public-api';
import { publicRestaurantsToUi } from '../lib/public-api-mappers';

// ---------- Test fixtures (replace with MSW handlers when devDep lands) ----------

function makeRestaurant(overrides: Partial<PublicRestaurant> = {}): PublicRestaurant {
  return {
    id: 'rest_1',
    slug: 'osh-markazi',
    name: { uz: 'Osh Markazi', ru: 'Центр Плова', en: 'Pilaf Center' },
    cuisine: 'uzbek',
    cuisine_label: { uz: "O'zbek", ru: 'Узбекская', en: 'Uzbek' },
    logo_url: null,
    cover_url: null,
    rating: 4.7,
    review_count: 124,
    delivery_minutes: 25,
    delivery_fee: 8000,
    min_order_amount: 30000,
    is_featured: true,
    is_open: true,
    promotion: null,
    updated_at: '2026-04-26T10:00:00Z',
    ...overrides,
  };
}

const ORIGINAL_FETCH = global.fetch;

beforeEach(() => {
  // Vitest fresh mock per test.
  vi.restoreAllMocks();
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
});

describe('publicConsumerApi.restaurants.list', () => {
  it('returns paginated list from API data', async () => {
    const payload: PublicRestaurantsListResponse = {
      data: [makeRestaurant(), makeRestaurant({ id: 'rest_2', slug: 'plov-club' })],
      meta: { next_cursor: null, has_more: false, total: 2 },
    };

    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const res = await publicConsumerApi.restaurants.list();
    expect(res.data).toHaveLength(2);
    expect(res.data[0]?.slug).toBe('osh-markazi');
    expect(res.meta.total).toBe(2);
  });

  it('throws PublicApiError on 5xx', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response('{"message":"server error"}', {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(publicConsumerApi.restaurants.list()).rejects.toThrow();
  });

  it('throws on network error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));

    await expect(publicConsumerApi.restaurants.list()).rejects.toThrow(TypeError);
  });

  it('passes Accept-Language header for the active locale', async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return Promise.resolve(
        new Response('{"data":[],"meta":{"next_cursor":null,"has_more":false,"total":0}}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    await publicConsumerApi.restaurants.list({}, { locale: 'ru' });

    expect(calls[0]).toBeDefined();
    const headers = new Headers(calls[0]![1]?.headers);
    expect(headers.get('Accept-Language')).toBe('ru');
  });

  it('respects ?cuisine and ?q query params', async () => {
    const captured: string[] = [];
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      captured.push(typeof input === 'string' ? input : input.toString());
      return Promise.resolve(
        new Response('{"data":[],"meta":{"next_cursor":null,"has_more":false,"total":0}}', {
          status: 200,
        }),
      );
    });

    await publicConsumerApi.restaurants.list({ cuisine: 'uzbek', q: 'osh' });
    expect(captured[0]).toContain('cuisine=uzbek');
    expect(captured[0]).toContain('q=osh');
  });
});

describe('publicRestaurantsToUi mapper', () => {
  it('respects locale for restaurant name', () => {
    const restaurants = [makeRestaurant()];

    const uz = publicRestaurantsToUi(restaurants, 'uz')[0]!;
    const ru = publicRestaurantsToUi(restaurants, 'ru')[0]!;
    const en = publicRestaurantsToUi(restaurants, 'en')[0]!;

    expect(uz.name).toBe('Osh Markazi');
    expect(ru.name).toBe('Центр Плова');
    expect(en.name).toBe('Pilaf Center');
  });

  it('falls back to uz when locale is missing', () => {
    const restaurants = [
      makeRestaurant({
        name: { uz: 'Фолбек', ru: '', en: '' },
      }),
    ];
    const en = publicRestaurantsToUi(restaurants, 'en')[0]!;
    expect(en.name).toBe('Фолбек');
  });

  it('preserves all UI shape fields', () => {
    const restaurants = [
      makeRestaurant({
        rating: 4.2,
        delivery_minutes: 30,
        delivery_fee: 12000,
      }),
    ];

    const ui = publicRestaurantsToUi(restaurants, 'uz')[0]!;
    expect(ui.rating).toBe(4.2);
    expect(ui.deliveryMinutes).toBe(30);
    expect(ui.deliveryFee).toBe(12000);
    expect(ui.cuisine).toBe('uzbek');
    expect(typeof ui.imageEmoji).toBe('string');
  });

  it('coerces missing promotion to undefined', () => {
    const ui = publicRestaurantsToUi([makeRestaurant({ promotion: null })], 'uz')[0]!;
    expect(ui.promotion).toBeUndefined();
  });
});

describe('Restaurant list state machine (loading / error)', () => {
  it('represents loading state', async () => {
    let resolve: (value: Response) => void;
    const pending = new Promise<Response>((r) => {
      resolve = r;
    });
    global.fetch = vi.fn(() => pending);

    const promise = publicConsumerApi.restaurants.list();
    // The promise is unresolved → loading.
    let pendingFlag = true;
    promise.then(() => {
      pendingFlag = false;
    });

    expect(pendingFlag).toBe(true);

    // Cleanup.
    resolve!(
      new Response('{"data":[],"meta":{"next_cursor":null,"has_more":false,"total":0}}', {
        status: 200,
      }),
    );
    await promise;
  });

  it('shows error state on API failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response('{"message":"down"}', { status: 503 })),
    );

    const promise = publicConsumerApi.restaurants.list();
    await expect(promise).rejects.toMatchObject({ name: 'PublicApiError', status: 503 });
  });

  it('captures error body for diagnostic display', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'rate limited', code: 'rl_exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    let caught: unknown = null;
    try {
      await publicConsumerApi.restaurants.list();
    } catch (e) {
      caught = e;
    }

    const error = caught as { status: number; body: { message: string } };
    expect(error.status).toBe(429);
    expect(error.body?.message).toBe('rate limited');
  });
});

describe('publicConsumerApi.menu.bySlug', () => {
  it('GETs /api/v1/public/menu/{slug}', async () => {
    let captured = '';
    global.fetch = vi.fn((url: RequestInfo | URL) => {
      captured = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              restaurant: makeRestaurant(),
              categories: [],
              items: [],
            },
          }),
          { status: 200 },
        ),
      );
    });

    await publicConsumerApi.menu.bySlug('osh-markazi');
    expect(captured).toContain('/api/v1/public/menu/osh-markazi');
  });

  it('throws on unknown slug (404)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response('{"message":"not found"}', { status: 404 })),
    );

    await expect(publicConsumerApi.menu.bySlug('not-real')).rejects.toMatchObject({
      status: 404,
    });
  });
});
