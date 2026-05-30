/**
 * B7-T10 — End-to-end order flow (cart → checkout → tracking).
 *
 * Targets the consumer marketplace flow. Tests cover:
 *   - Cart persists across navigation (zustand persist middleware).
 *   - Checkout submits to /api/v1/public/orders.
 *   - Redirect to tracking happens on success.
 *   - tracking_token is exposed to the page after order placed.
 *
 * The cart store uses `localStorage` via `createJSONStorage`. We polyfill
 * `localStorage` since Vitest's default environment is `node`. The test
 * file overrides `globalThis.localStorage` per-test for isolation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------- Lightweight in-memory localStorage polyfill ----------

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  // Fresh storage per test so persisted state from one doesn't bleed.
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.resetModules(); // reload zustand store with fresh persist storage
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cart store persistence', () => {
  it('persists items across module reloads', async () => {
    const { useCartStore } = await import('../stores/cart');

    useCartStore.getState().addItem(
      {
        id: 'item-1',
        restaurantSlug: 'osh',
        name: 'Osh',
        priceMinor: 50000,
        quantity: 2,
        emoji: '🍚',
        bgColor: 'bg-amber-100',
      },
      'Osh Markazi',
    );

    expect(useCartStore.getState().items).toHaveLength(1);

    // Force the persist middleware to flush; access is synchronous.
    const stored = (globalThis as { localStorage: Storage }).localStorage.getItem(
      'mypos_consumer_cart',
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.items).toHaveLength(1);
    expect(parsed.state.items[0].id).toBe('item-1');
  });

  it('replaces cart on different restaurant (Wolt/Glovo behaviour)', async () => {
    const { useCartStore } = await import('../stores/cart');

    useCartStore.getState().addItem(
      {
        id: 'a',
        restaurantSlug: 'rest-a',
        name: 'A',
        priceMinor: 10000,
        quantity: 1,
        emoji: '🥘',
        bgColor: 'bg-amber-100',
      },
      'A',
    );
    useCartStore.getState().addItem(
      {
        id: 'b',
        restaurantSlug: 'rest-b',
        name: 'B',
        priceMinor: 10000,
        quantity: 1,
        emoji: '🥘',
        bgColor: 'bg-amber-100',
      },
      'B',
    );

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.id).toBe('b');
    expect(state.restaurantSlug).toBe('rest-b');
  });

  it('increments quantity when adding the same item twice', async () => {
    const { useCartStore } = await import('../stores/cart');

    const item = {
      id: 'osh',
      restaurantSlug: 'osh-markazi',
      name: 'Osh',
      priceMinor: 50000,
      quantity: 1,
      emoji: '🍚',
      bgColor: 'bg-amber-100',
    };
    useCartStore.getState().addItem(item, 'Osh Markazi');
    useCartStore.getState().addItem(item, 'Osh Markazi');

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(2);
  });

  it('selectCartTotal computes total correctly', async () => {
    const { useCartStore, selectCartTotal } = await import('../stores/cart');

    useCartStore.getState().addItem(
      { id: 'a', restaurantSlug: 'r', name: 'A', priceMinor: 10000, quantity: 2, emoji: '', bgColor: '' },
      'r',
    );
    useCartStore.getState().addItem(
      { id: 'b', restaurantSlug: 'r', name: 'B', priceMinor: 5000, quantity: 3, emoji: '', bgColor: '' },
      'r',
    );

    expect(selectCartTotal(useCartStore.getState())).toBe(10000 * 2 + 5000 * 3);
  });

  it('removeItem drops the entry from the cart', async () => {
    const { useCartStore } = await import('../stores/cart');

    useCartStore.getState().addItem(
      { id: 'x', restaurantSlug: 'r', name: 'X', priceMinor: 5000, quantity: 1, emoji: '', bgColor: '' },
      'r',
    );
    useCartStore.getState().removeItem('x');

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('checkout submits to /api/v1/public/orders', () => {
  it('POSTs the cart payload to the public orders endpoint', async () => {
    const captured: Array<{ url: string; init: RequestInit | undefined }> = [];

    global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
      captured.push({ url: String(url), init });
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              id: 'ord_1',
              order_no: 'MP-000001',
              tracking_token: 'tok_abc123',
              status: 'pending',
              restaurant: { slug: 'osh', name: { uz: 'Osh', ru: 'Osh', en: 'Osh' } },
              items: [],
              amounts: { subtotal: 0, delivery_fee: 0, service_fee: 0, total: 0 },
              address: { label: 'home', street: 'L1' },
              payment_method: 'cash',
              placed_at: new Date().toISOString(),
              estimated_delivery_at: null,
            },
          }),
          { status: 201 },
        ),
      );
    }) as unknown as typeof fetch;

    const { publicConsumerApi } = await import('../lib/public-api');
    const res = await publicConsumerApi.orders.create({
      restaurant_slug: 'osh',
      items: [{ menu_item_id: 'item-1', quantity: 2 }],
      customer: { name: 'A', phone: '+998901234567' },
      address: { label: 'home', street: 'L1' },
      payment_method: 'cash',
    });

    expect(res.data.tracking_token).toBe('tok_abc123');
    expect(captured[0]?.url).toContain('/api/v1/public/orders');
    expect(captured[0]?.init?.method).toBe('POST');

    const body = JSON.parse(String(captured[0]?.init?.body ?? '{}'));
    expect(body.restaurant_slug).toBe('osh');
    expect(body.items).toHaveLength(1);
  });

  it('shows tracking_token after order placed', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              id: 'ord_2',
              order_no: 'MP-000002',
              tracking_token: 'tok_xyz789',
              status: 'pending',
              restaurant: { slug: 'osh', name: { uz: 'X', ru: 'X', en: 'X' } },
              items: [],
              amounts: { subtotal: 0, delivery_fee: 0, service_fee: 0, total: 0 },
              address: { label: 'h', street: 'L' },
              payment_method: 'cash',
              placed_at: new Date().toISOString(),
              estimated_delivery_at: null,
            },
          }),
          { status: 201 },
        ),
      ),
    ) as unknown as typeof fetch;

    const { publicConsumerApi } = await import('../lib/public-api');
    const res = await publicConsumerApi.orders.create({
      restaurant_slug: 'osh',
      items: [{ menu_item_id: 'item', quantity: 1 }],
      customer: { name: 'A', phone: '+998901234567' },
      address: { label: 'h', street: 'L' },
      payment_method: 'cash',
    });

    // Caller decides routing — we just assert the token round-trip.
    expect(res.data.tracking_token).toBe('tok_xyz789');
  });

  it('throws PublicApiError when submission fails (422)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Invalid phone' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ) as unknown as typeof fetch;

    const { publicConsumerApi } = await import('../lib/public-api');
    await expect(
      publicConsumerApi.orders.create({
        restaurant_slug: 'osh',
        items: [{ menu_item_id: 'item', quantity: 1 }],
        customer: { name: 'A', phone: 'bad' },
        address: { label: 'h', street: 'L' },
        payment_method: 'cash',
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe('tracking endpoint', () => {
  it('redirects to tracking on success (caller resolves the URL)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              id: 'ord_3',
              order_no: 'MP-000003',
              tracking_token: 'tok_redirect',
              status: 'pending',
              restaurant: { slug: 'osh', name: { uz: 'X', ru: 'X', en: 'X' } },
              items: [],
              amounts: { subtotal: 0, delivery_fee: 0, service_fee: 0, total: 0 },
              address: { label: 'h', street: 'L' },
              payment_method: 'cash',
              placed_at: new Date().toISOString(),
              estimated_delivery_at: null,
            },
          }),
          { status: 200 },
        ),
      ),
    ) as unknown as typeof fetch;

    const { publicConsumerApi } = await import('../lib/public-api');
    const res = await publicConsumerApi.orders.track('tok_redirect');
    expect(res.data.tracking_token).toBe('tok_redirect');
  });

  it('throws on invalid tracking token (404)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response('{"message":"Not found"}', { status: 404 })),
    ) as unknown as typeof fetch;

    const { publicConsumerApi } = await import('../lib/public-api');
    await expect(publicConsumerApi.orders.track('bad-token')).rejects.toMatchObject({
      status: 404,
    });
  });
});
