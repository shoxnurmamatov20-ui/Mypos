/**
 * Mock order persistence (Phase 5).
 *
 * Mirrors `apps/mobile-consumer/src/lib/storage.ts` 1:1 but uses
 * `localStorage` instead of SecureStore. The checkout page builds an order
 * payload here, persists it, then navigates to /order-success/[id] which
 * reads it back. The orders list (Phase 6) reuses the same helpers plus
 * `deriveOrderStatus()` to simulate kitchen → courier progression based on
 * elapsed time. Once the backend exposes `/orders` the whole module goes
 * away in favour of `ordersApi.show(id)`.
 *
 * All helpers are SSR-safe — they short-circuit on the server. Always
 * call them from `'use client'` components or inside `useEffect`.
 */

import type { DeliveryAddress, PaymentMethod } from '@/stores/checkout';

const ORDER_PREFIX = 'mypos_consumer_order_';
const ORDER_INDEX_KEY = 'mypos_consumer_order_index';
const ORDER_INDEX_MAX = 50;

export type MockOrderItem = {
  id: string;
  name: string;
  quantity: number;
  priceMinor: number;
  emoji: string;
};

export type MockOrder = {
  id: string;
  orderNo: string;
  restaurantSlug: string | null;
  restaurantName: string | null;
  items: MockOrderItem[];
  amounts: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
  };
  address: DeliveryAddress;
  paymentMethod: PaymentMethod;
  notes: string;
  /** ISO timestamp when the order was placed. Drives deriveOrderStatus. */
  placedAt: string;
  /**
   * Public tracking token returned by the API. Used by /track/[token] +
   * the success page's "Track" link. Optional for backwards compatibility
   * with orders saved before the API integration landed.
   */
  trackingToken?: string;
};

export type MockOrderStatus = 'pending' | 'preparing' | 'ready' | 'on_the_way' | 'delivered';

function orderKey(id: string): string {
  return `${ORDER_PREFIX}${id}`;
}

// ------------ Single order persistence ------------

export function saveMockOrder(order: MockOrder): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(orderKey(order.id), JSON.stringify(order));
    appendToOrderIndex(order.id);
  } catch {
    // localStorage may be disabled (private mode) — swallow silently.
  }
}

export function loadMockOrder(id: string): MockOrder | null {
  if (typeof window === 'undefined') return null;
  try {
    const json = localStorage.getItem(orderKey(id));
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<MockOrder>;
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.amounts) {
      return null;
    }
    return parsed as MockOrder;
  } catch {
    return null;
  }
}

// ------------ Order index (newest first) ------------

export function appendToOrderIndex(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = localStorage.getItem(ORDER_INDEX_KEY);
    const ids = current ? current.split(',').filter(Boolean) : [];
    if (ids.includes(id)) return;
    ids.unshift(id);
    const trimmed = ids.slice(0, ORDER_INDEX_MAX);
    localStorage.setItem(ORDER_INDEX_KEY, trimmed.join(','));
  } catch {
    // ignore
  }
}

export function getOrderIndex(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = localStorage.getItem(ORDER_INDEX_KEY);
    return current ? current.split(',').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function loadAllMockOrders(): MockOrder[] {
  return getOrderIndex()
    .map((id) => loadMockOrder(id))
    .filter((o): o is MockOrder => o !== null);
}

// ------------ Status derivation ------------

/**
 * Simulated status progression based on minutes elapsed since `placedAt`:
 *   0–2 min  : pending
 *   2–7 min  : preparing
 *   7–15 min : ready
 *   15–25 min: on_the_way
 *   25+ min  : delivered
 */
export function deriveOrderStatus(order: MockOrder): MockOrderStatus {
  const placedAt = new Date(order.placedAt).getTime();
  if (!Number.isFinite(placedAt)) return 'pending';
  const minutesElapsed = (Date.now() - placedAt) / 60_000;
  if (minutesElapsed < 2) return 'pending';
  if (minutesElapsed < 7) return 'preparing';
  if (minutesElapsed < 15) return 'ready';
  if (minutesElapsed < 25) return 'on_the_way';
  return 'delivered';
}
