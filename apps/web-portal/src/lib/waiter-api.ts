'use client';

/**
 * Waiter-panel Laravel API client.
 *
 * Auth is the Sanctum bearer token persisted by `LoginForm` (see
 * `waiter-session.ts`). Endpoints are the existing tenant CRUD + `staff/*`
 * routes — no waiter-specific backend exists; this module maps the raw
 * Laravel resources onto the view types in `waiter-data.ts` so the
 * components render identically from live data and from fixtures.
 *
 * Money: `orders.amounts.*`, `stats.revenue_minor` and `stats.tips_minor`
 * are all plain so'm (the `_minor` suffix is historic — the backend sums
 * `total_amount`, which is stored in so'm).
 */

import type {
  MenuCategory,
  OrderStatus,
  TableStatus,
  WaiterOrder,
  WaiterTable,
} from './waiter-data';
import { readWaiterSession } from './waiter-session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class WaiterApiError extends Error {
  constructor(public readonly status: number) {
    super(`API ${status}`);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = readWaiterSession()?.token;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new WaiterApiError(res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

type Envelope<T> = { data: T };

// ─── Raw Laravel resource shapes (only the fields we read) ───────────────────

type LocalizedName = string | Record<string, string | undefined>;

type RawTable = {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'disabled';
  category?: { name?: LocalizedName } | null;
};

type RawOrderItem = { name: LocalizedName; quantity: number; price_amount: number };

type RawOrder = {
  id: string;
  order_no: string;
  status: string;
  guest_count: number | null;
  table_id: string | null;
  table?: { name?: string } | null;
  amounts?: { total?: number } | null;
  items?: RawOrderItem[] | null;
  placed_at: string | null;
  prepared_at: string | null;
  served_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type RawMenuCategory = { id: string; name: LocalizedName };
type RawMenuItem = {
  id: string;
  category_id: string;
  name: LocalizedName;
  price?: { amount?: number; effective_amount?: number } | null;
  is_active?: boolean;
  image_url?: string | null;
  description?: LocalizedName | null;
};

type RawShift = { actual_start: string | null; status: { value: string } };
type RawStats = { orders_count: number; revenue_minor: number; tips_minor: number };

// ─── Mapping helpers ─────────────────────────────────────────────────────────

export function pickName(name: LocalizedName, locale: string): string {
  if (typeof name === 'string') return name;
  return name[locale] ?? name.uz ?? name.ru ?? name.en ?? Object.values(name)[0] ?? '';
}

function toHHMM(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Bare table number for the grid tile — the digits inside "12-stol" → "12". */
function tableNumber(name: string): string {
  const match = name.match(/\d+/);
  return match ? match[0] : name;
}

const ORDER_STATUS_MAP: Record<string, OrderStatus | null> = {
  draft: 'open',
  pending: 'sent',
  preparing: 'sent',
  ready: 'ready',
  served: 'served',
  completed: 'paid',
  cancelled: null,
  refunded: null,
};

/** Backend statuses that mean "this order still occupies its table". */
const OPEN_BACKEND_STATUSES = new Set(['pending', 'preparing', 'ready', 'served']);

function mapOrder(raw: RawOrder, locale: string): WaiterOrder | null {
  const status = ORDER_STATUS_MAP[raw.status];
  if (!status) return null;
  return {
    id: raw.order_no,
    apiId: raw.id,
    table: raw.table?.name ?? '—',
    status,
    guests: raw.guest_count ?? 0,
    openedAt: toHHMM(raw.placed_at ?? raw.created_at),
    items: (raw.items ?? []).map((item) => ({
      name: pickName(item.name, locale),
      qty: item.quantity,
      price: item.price_amount,
    })),
    total: raw.amounts?.total ?? 0,
  };
}

const TABLE_STATUS_MAP: Record<RawTable['status'], TableStatus | null> = {
  available: 'free',
  occupied: 'seated',
  reserved: 'reserved',
  disabled: null,
};

/**
 * Tables enriched with the waiter's own open orders: a matching order
 * contributes guests/total/order-number, and a `served` order (delivered,
 * awaiting payment) refines "seated" into "bill".
 */
function mapTables(rawTables: RawTable[], rawOrders: RawOrder[], locale: string): WaiterTable[] {
  // `rawOrders` are the current waiter's *own* orders, so any table matched
  // here is "mine" (rendered green on the grid); occupied tables with no match
  // belong to a colleague (yellow).
  const myName = readWaiterSession()?.name;
  const openByTable = new Map<string, RawOrder>();
  for (const order of rawOrders) {
    if (order.table_id && OPEN_BACKEND_STATUSES.has(order.status)) {
      if (!openByTable.has(order.table_id)) openByTable.set(order.table_id, order);
    }
  }

  const tables: WaiterTable[] = [];
  for (const raw of rawTables) {
    let status = TABLE_STATUS_MAP[raw.status];
    if (!status) continue;
    const order = openByTable.get(raw.id);
    if (order && status === 'seated' && order.status === 'served') status = 'bill';
    tables.push({
      id: raw.id,
      label: raw.name,
      number: tableNumber(raw.name),
      seats: raw.capacity,
      zone: raw.category?.name ? pickName(raw.category.name, locale) : '',
      status,
      ...(order
        ? {
            mine: true,
            occupantName: myName,
            openedAt: toHHMM(order.placed_at ?? order.created_at),
            itemsCount: (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
            guests: order.guest_count ?? undefined,
            total: order.amounts?.total ?? undefined,
            orderId: order.order_no,
          }
        : {}),
    });
  }
  return tables;
}

function mapMenu(
  rawCategories: RawMenuCategory[],
  rawItems: RawMenuItem[],
  locale: string,
): MenuCategory[] {
  return rawCategories
    .map((category) => ({
      name: pickName(category.name, locale),
      items: rawItems
        .filter((item) => item.category_id === category.id)
        .map((item) => ({
          id: item.id,
          name: pickName(item.name, locale),
          price: item.price?.effective_amount ?? item.price?.amount ?? 0,
          available: item.is_active !== false,
          ...(item.image_url ? { image: item.image_url } : {}),
          ...(item.description ? { description: pickName(item.description, locale) } : {}),
        })),
    }))
    .filter((category) => category.items.length > 0);
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

async function fetchMyOrdersRaw(): Promise<RawOrder[]> {
  const res = await request<Envelope<RawOrder[]>>('GET', '/api/v1/staff/orders/my?per_page=50');
  return res.data ?? [];
}

export async function fetchWaiterOrders(locale: string): Promise<WaiterOrder[]> {
  const raw = await fetchMyOrdersRaw();
  return raw
    .map((order) => mapOrder(order, locale))
    .filter((order): order is WaiterOrder => order !== null);
}

export async function fetchWaiterTables(locale: string): Promise<WaiterTable[]> {
  const [tablesRes, orders] = await Promise.all([
    request<Envelope<RawTable[]>>('GET', '/api/v1/tables'),
    fetchMyOrdersRaw().catch(() => [] as RawOrder[]),
  ]);
  return mapTables(tablesRes.data ?? [], orders, locale);
}

export async function fetchWaiterMenu(locale: string): Promise<MenuCategory[]> {
  const [categoriesRes, itemsRes] = await Promise.all([
    request<Envelope<RawMenuCategory[]>>('GET', '/api/v1/menu/categories?active_only=1'),
    request<Envelope<RawMenuItem[]>>('GET', '/api/v1/menu/items?active_only=1&per_page=200'),
  ]);
  return mapMenu(categoriesRes.data ?? [], itemsRes.data ?? [], locale);
}

/** Event keys the view resolves through i18n (`waiter.shift.events.*`). */
export type ShiftEventKey = 'placed' | 'ready' | 'served' | 'paid';
export interface LiveShiftActivity {
  at: string;
  event: ShiftEventKey;
  orderNo: string;
}

export async function fetchWaiterShift(): Promise<{
  onShift: boolean;
  startedAt: string;
  ordersCount: number;
  salesTotal: number;
  tipsTotal: number;
  tablesServed: number;
  activeTables: number;
  activity: LiveShiftActivity[];
}> {
  const [shiftRes, statsRes, orders] = await Promise.all([
    request<Envelope<RawShift | null>>('GET', '/api/v1/staff/shifts/current'),
    request<Envelope<RawStats>>('GET', '/api/v1/staff/stats?period=today'),
    fetchMyOrdersRaw().catch(() => [] as RawOrder[]),
  ]);

  const shift = shiftRes.data;
  const stats = statsRes.data;

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.placed_at ?? o.created_at).toDateString() === today,
  );
  const distinct = (rows: RawOrder[]) => new Set(rows.map((o) => o.table_id).filter(Boolean)).size;

  const activity: LiveShiftActivity[] = todayOrders
    .map((o): LiveShiftActivity | null => {
      if (o.completed_at) return { at: toHHMM(o.completed_at), event: 'paid', orderNo: o.order_no };
      if (o.served_at) return { at: toHHMM(o.served_at), event: 'served', orderNo: o.order_no };
      if (o.prepared_at) return { at: toHHMM(o.prepared_at), event: 'ready', orderNo: o.order_no };
      if (o.placed_at) return { at: toHHMM(o.placed_at), event: 'placed', orderNo: o.order_no };
      return null;
    })
    .filter((e): e is LiveShiftActivity => e !== null)
    .slice(0, 6);

  return {
    onShift: shift !== null && ['open', 'in_progress'].includes(shift.status.value),
    startedAt: toHHMM(shift?.actual_start ?? null) || '—',
    ordersCount: stats.orders_count ?? 0,
    salesTotal: stats.revenue_minor ?? 0,
    tipsTotal: stats.tips_minor ?? 0,
    tablesServed: distinct(todayOrders),
    activeTables: distinct(orders.filter((o) => OPEN_BACKEND_STATUSES.has(o.status))),
    activity,
  };
}

/** One-tap "Mehmonga berdim" — advances a ready order to served. */
export async function markOrderServed(apiId: string): Promise<void> {
  await request('PATCH', `/api/v1/staff/orders/${apiId}/status`, { status: 'served' });
}

export interface NewOrderInput {
  tableId: string | null;
  guests: number;
  items: { menuItemId: string; quantity: number }[];
}

/** Creates a dine-in order (status `pending` → shows as "Oshxonada"). */
export async function createStaffOrder(input: NewOrderInput): Promise<{ orderNo: string }> {
  const res = await request<Envelope<{ order_no: string }>>('POST', '/api/v1/staff/orders', {
    type: 'dine_in',
    table_id: input.tableId,
    guest_count: input.guests > 0 ? input.guests : null,
    items: input.items.map((line) => ({
      menu_item_id: line.menuItemId,
      quantity: line.quantity,
    })),
  });
  return { orderNo: res.data.order_no };
}

export async function clockIn(): Promise<void> {
  await request('POST', '/api/v1/staff/clock-in', {});
}

export async function clockOut(): Promise<void> {
  await request('POST', '/api/v1/staff/clock-out', {});
}
