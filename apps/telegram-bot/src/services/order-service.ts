import { type CreateOrderInput, type Order, type OrderStatus, ordersApi } from '@mypos/api-client';
import { apiClient } from '../api.js';
import type { CartItem, OrderMode } from '../types.js';

export type PlaceOrderInput = {
  mode: OrderMode;
  cart: CartItem[];
  tableId?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

/**
 * Places an order via the authenticated `/orders` endpoint using the bot's
 * service-account token. The API resolves the bot user as the "customer".
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const body: CreateOrderInput = {
    type: input.mode === 'dine_in' ? 'dine_in' : 'delivery',
    table_id: input.tableId ?? null,
    notes: composeNotes(input),
    items: input.cart.map((line) => ({
      menu_item_id: line.menu_item_id,
      quantity: line.quantity,
    })),
  };
  const res = await ordersApi.create(apiClient(), body);
  return res.data;
}

/** Compose a `notes` field for delivery info — the API model doesn't have
 * dedicated phone/address fields at this stage, so we stash them here. */
function composeNotes(input: PlaceOrderInput): string | null {
  const parts: string[] = [];
  if (input.phone) parts.push(`Phone: ${input.phone}`);
  if (input.address) parts.push(`Address: ${input.address}`);
  if (input.notes) parts.push(input.notes);
  return parts.length > 0 ? parts.join(' | ') : null;
}

export async function listRecentOrders(): Promise<Order[]> {
  const res = await ordersApi.list(apiClient(), { per_page: 10 });
  return res.data;
}

export async function getOrder(id: string): Promise<Order> {
  const res = await ordersApi.show(apiClient(), id);
  return res.data;
}

/** Pretty label for an order status, translation is done at call site. */
export function formatStatus(status: OrderStatus): string {
  return status.replace(/_/g, ' ');
}
