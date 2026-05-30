'use client';

import type { LocalizedName } from './format';

/**
 * Thin Laravel API client for the cashier panel.
 *
 * Auth is a Sanctum bearer token, handed over from the universal portal via
 * the URL fragment (`#token=…&role=…`) or restored from `localStorage`.
 *
 * Each endpoint fetches the *raw* Laravel resource shape and maps it to the
 * flat, view-friendly types the components expect — the backend nests user
 * under `staff/me`, wraps menu prices in `{ amount, … }`, serialises shift
 * status as `{ value, label }` badges, and reports stats in minor units, so
 * the mapping layer is where all of that is normalised.
 *
 * The React Query hooks fall back to `mock-data` fixtures when a request
 * throws, so the panel still renders if the API is unreachable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const TOKEN_KEY = 'mypos_cashier_token';
export const PORTAL_TOKEN_KEY = 'mypos_token';

// ─── Flat view types (what the components consume) ───────────────────────────

export type CashierUser = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  locale: string;
  tenant_name: string | null;
};

export type MenuCategory = {
  id: string;
  name: LocalizedName;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: LocalizedName;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type OrderPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'void';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type OrderSummary = {
  id: string;
  order_no: string;
  type: OrderType;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  items_count: number;
  guest_count: number | null;
  table_name: string | null;
  total: number;
  placed_at: string | null;
};

export type PaymentMethod = 'cash' | 'card' | 'click' | 'payme' | 'uzum' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentRow = {
  id: string;
  order_no: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  created_at: string;
};

export type ShiftStatus = 'scheduled' | 'open' | 'closed' | 'missed' | 'in_progress';

export type ShiftInfo = {
  id: string;
  status: ShiftStatus;
  started_at: string | null;
  ended_at: string | null;
  worked_minutes: number;
  break_minutes: number;
  on_break: boolean;
  break_started_at: string | null;
};

export type ShiftStats = {
  orders_count: number;
  revenue: number;
  avg_order: number;
  tips: number;
};

export type RecentShift = {
  id: string;
  date: string;
  status: ShiftStatus;
  worked_minutes: number;
};

// ─── Raw Laravel resource shapes (internal — only the fields we read) ────────

type RawBadge<T extends string> = { value: T; label: string };

type RawStaffMe = {
  user: {
    id: string;
    name: string;
    email: string | null;
    locale: string;
    roles: string[];
    tenant: { name: string } | null;
  };
  employee?: { role?: RawBadge<string> } | null;
};

type RawMenuCategory = { id: string; name: LocalizedName };
type RawMenuItem = {
  id: string;
  category_id: string;
  name: LocalizedName;
  price: { amount: number; effective_amount: number };
  image_url: string | null;
  is_active: boolean;
};

type RawOrder = {
  id: string;
  order_no: string;
  type: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  guest_count: number | null;
  table?: { name?: string | null } | null;
  amounts?: { total?: number } | null;
  items?: unknown[] | null;
  placed_at: string | null;
};

type RawPayment = {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  status: string;
  created_at: string | null;
  captured_at: string | null;
};

type RawShift = {
  id: string;
  actual_start: string | null;
  actual_end: string | null;
  scheduled_start: string | null;
  worked_minutes: number | null;
  status: RawBadge<string>;
  breaks?: { ended_at: string | null; duration_minutes: number | null; started_at: string }[];
  created_at?: string | null;
};

type RawStats = {
  orders_count: number;
  revenue_minor: number;
  tips_minor: number;
  avg_order_minor: number;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapUser(raw: RawStaffMe): CashierUser {
  return {
    id: raw.user.id,
    name: raw.user.name,
    email: raw.user.email,
    role: raw.employee?.role?.value ?? raw.user.roles[0] ?? 'cashier',
    locale: raw.user.locale,
    tenant_name: raw.user.tenant?.name ?? null,
  };
}

function mapItem(raw: RawMenuItem): MenuItem {
  return {
    id: raw.id,
    category_id: raw.category_id,
    name: raw.name,
    price: raw.price?.effective_amount ?? raw.price?.amount ?? 0,
    image_url: raw.image_url ?? null,
    is_available: raw.is_active !== false,
  };
}

const ORDER_TYPES: OrderType[] = ['dine_in', 'takeaway', 'delivery'];

function mapOrder(raw: RawOrder): OrderSummary {
  const type = ORDER_TYPES.includes(raw.type as OrderType)
    ? (raw.type as OrderType)
    : 'takeaway';
  return {
    id: raw.id,
    order_no: raw.order_no,
    type,
    status: raw.status,
    payment_status: raw.payment_status,
    items_count: raw.items?.length ?? 0,
    guest_count: raw.guest_count,
    table_name: raw.table?.name ?? null,
    total: raw.amounts?.total ?? 0,
    placed_at: raw.placed_at,
  };
}

const METHODS: Record<string, PaymentMethod> = {
  cash: 'cash',
  card: 'card',
  click: 'click',
  payme: 'payme',
  uzum: 'uzum',
};

function mapPaymentStatus(raw: string): PaymentStatus {
  if (raw === 'captured') return 'paid';
  if (raw === 'refunded') return 'refunded';
  if (raw === 'failed' || raw === 'cancelled') return 'failed';
  return 'pending';
}

function mapPayment(raw: RawPayment): PaymentRow {
  return {
    id: raw.id,
    order_no: `#${raw.order_id.slice(0, 8)}`,
    method: METHODS[raw.provider] ?? 'other',
    status: mapPaymentStatus(raw.status),
    amount: raw.amount,
    created_at: raw.created_at ?? raw.captured_at ?? '',
  };
}

const SHIFT_STATUSES: ShiftStatus[] = [
  'scheduled',
  'open',
  'closed',
  'missed',
  'in_progress',
];

function mapShiftStatus(raw: string): ShiftStatus {
  return SHIFT_STATUSES.includes(raw as ShiftStatus) ? (raw as ShiftStatus) : 'scheduled';
}

function mapShift(raw: RawShift): ShiftInfo {
  const breaks = raw.breaks ?? [];
  const openBreak = breaks.find((b) => b.ended_at === null) ?? null;
  const breakMinutes = breaks.reduce((sum, b) => sum + (b.duration_minutes ?? 0), 0);
  return {
    id: raw.id,
    status: mapShiftStatus(raw.status.value),
    started_at: raw.actual_start,
    ended_at: raw.actual_end,
    worked_minutes: raw.worked_minutes ?? 0,
    break_minutes: breakMinutes,
    on_break: openBreak !== null,
    break_started_at: openBreak?.started_at ?? null,
  };
}

function mapRecentShift(raw: RawShift): RecentShift {
  return {
    id: raw.id,
    date: raw.actual_start ?? raw.scheduled_start ?? raw.created_at ?? '',
    status: mapShiftStatus(raw.status.value),
    worked_minutes: raw.worked_minutes ?? 0,
  };
}

function mapStats(raw: RawStats): ShiftStats {
  return {
    orders_count: raw.orders_count ?? 0,
    revenue: Math.round((raw.revenue_minor ?? 0) / 100),
    avg_order: Math.round((raw.avg_order_minor ?? 0) / 100),
    tips: Math.round((raw.tips_minor ?? 0) / 100),
  };
}

// ─── Token helpers ───────────────────────────────────────────────────────────

let inMemoryToken: string | null = null;

export function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  inMemoryToken = token;
  return token;
}

export function storeToken(token: string): void {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  inMemoryToken = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PORTAL_TOKEN_KEY);
    window.localStorage.removeItem('mypos_role');
  }
}

export function getToken(): string | null {
  return inMemoryToken;
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? `API ${status}`);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (inMemoryToken) headers.Authorization = `Bearer ${inMemoryToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    clearToken();
    throw new ApiError(401, 'Unauthorized');
  }
  if (!res.ok) throw new ApiError(res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

type Envelope<T> = { data: T };

/** Some list endpoints are paginated (`{ data, meta }`), others flat — both
 *  expose the rows under `data`, so a single accessor works for all of them. */
async function getList<TRaw, TOut>(path: string, map: (r: TRaw) => TOut): Promise<TOut[]> {
  const res = await request<Envelope<TRaw[]>>('GET', path);
  return (res.data ?? []).map(map);
}

// ─── Endpoints (return flat, view-ready types) ───────────────────────────────

export const api = {
  me: async (): Promise<CashierUser> => {
    const res = await request<Envelope<RawStaffMe>>('GET', '/api/v1/staff/me');
    return mapUser(res.data);
  },

  menuCategories: () =>
    getList<RawMenuCategory, MenuCategory>(
      '/api/v1/menu/categories?active_only=1',
      (c) => ({ id: c.id, name: c.name }),
    ),

  menuItems: () =>
    getList<RawMenuItem, MenuItem>('/api/v1/menu/items?active_only=1', mapItem),

  orders: (status?: string) =>
    getList<RawOrder, OrderSummary>(
      `/api/v1/staff/orders/my${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      mapOrder,
    ),

  payments: () => getList<RawPayment, PaymentRow>('/api/v1/payments?per_page=50', mapPayment),

  currentShift: async (): Promise<ShiftInfo | null> => {
    const res = await request<Envelope<RawShift | null>>('GET', '/api/v1/staff/shifts/current');
    return res.data ? mapShift(res.data) : null;
  },

  shiftStats: async (): Promise<ShiftStats> => {
    const res = await request<Envelope<RawStats>>('GET', '/api/v1/staff/stats?period=today');
    return mapStats(res.data);
  },

  recentShifts: () =>
    getList<RawShift, RecentShift>('/api/v1/staff/shifts?per_page=8', mapRecentShift),

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<void> => {
    await request('PATCH', `/api/v1/staff/orders/${id}/status`, { status });
  },

  clockIn: async (): Promise<void> => {
    await request('POST', '/api/v1/staff/clock-in', {});
  },
  clockOut: async (): Promise<void> => {
    await request('POST', '/api/v1/staff/clock-out', {});
  },
  startBreak: async (): Promise<void> => {
    await request('POST', '/api/v1/staff/breaks/start', {});
  },
  endBreak: async (): Promise<void> => {
    await request('POST', '/api/v1/staff/breaks/end', {});
  },
};
