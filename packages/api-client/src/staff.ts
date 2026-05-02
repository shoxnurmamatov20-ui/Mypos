import type { MyPosApiClient } from './client';
import type { AuthUser } from './auth';
import type {
  CollectionResponse,
  PaginatedResponse,
  ResourceResponse,
} from './menu';
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderItemModifier,
  OrderStatus,
} from './orders';

// ─── Enums (string unions) ───────────────────────────────────────────────────

/**
 * Restaurant-floor positions (App\Domain\Employee\Enums\EmployeeRole).
 */
export type StaffEmployeePosition =
  | 'waiter'
  | 'cook'
  | 'cashier'
  | 'manager'
  | 'admin';

/**
 * Employment statuses (App\Domain\Employee\Enums\EmployeeStatus).
 *
 * NOTE: backend defines exactly three values — `active`, `on_leave`,
 * `terminated`. The legacy `inactive` label is NOT emitted by the API.
 */
export type StaffEmployeeStatus = 'active' | 'on_leave' | 'terminated';

/**
 * Shift lifecycle (App\Domain\Employee\Enums\ShiftStatus).
 *
 * NOTE: legacy data may also expose `in_progress` (the controller still
 * accepts it as a synonym for `open` in queries), so we widen the union.
 */
export type StaffShiftStatus =
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'missed'
  | 'in_progress';

export type StaffBreakReason = 'lunch' | 'rest' | 'personal' | 'other';

/**
 * Backend resources wrap enum-like fields in a `{ value, label }` envelope so
 * mobile clients get a translation-ready label without a second round trip.
 */
export type StaffEnumBadge<TValue extends string> = {
  value: TValue;
  label: string;
};

export type StaffEmployeeRoleBadge = StaffEnumBadge<StaffEmployeePosition> & {
  is_kitchen: boolean;
  is_floor: boolean;
  is_managerial: boolean;
};

// ─── Resources ───────────────────────────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\V1\Staff\EmployeeResource`.
 *
 * The staff-mobile EmployeeResource is intentionally a different shape than
 * the admin one (e.g. role/status are badge objects, no base_salary, etc.).
 */
export type StaffEmployeeUserSummary = Pick<
  AuthUser,
  'id' | 'name' | 'phone' | 'email' | 'locale' | 'avatar_url'
>;

export type StaffEmployee = {
  id: string;
  employee_code: string;
  role: StaffEmployeeRoleBadge;
  status: StaffEnumBadge<StaffEmployeeStatus>;
  hire_date: string | null;
  hourly_rate: number | null;
  last_clock_in_at: string | null;
  pin_set_at: string | null;
  // The resource only includes `user` when the relation is loaded; every
  // staff endpoint that returns an employee eager-loads it, so we treat
  // it as required.
  user: StaffEmployeeUserSummary;
};

export type StaffShiftBreak = {
  id: string;
  shift_id: string;
  employee_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_open: boolean;
  reason: StaffEnumBadge<StaffBreakReason> | null;
  notes: string | null;
};

export type StaffShift = {
  id: string;
  employee_id: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  worked_minutes: number | null;
  status: StaffEnumBadge<StaffShiftStatus>;
  notes: string | null;
  // Only present when the relation is eager-loaded; controllers do load it.
  breaks?: StaffShiftBreak[];
  created_at: string | null;
  updated_at: string | null;
};

// ─── /staff/me ───────────────────────────────────────────────────────────────

export type StaffMeResponse = {
  data: {
    user: AuthUser;
    employee: StaffEmployee;
    current_shift: StaffShift | null;
    active_break: StaffShiftBreak | null;
  };
};

// ─── /auth/staff-login ───────────────────────────────────────────────────────

export type StaffLoginInput = {
  phone: string;
  pin: string;
};

export type StaffLoginResponse = {
  data: {
    token: string;
    user: AuthUser;
    employee: StaffEmployee;
  };
};

// ─── /staff/clock-in /staff/clock-out ───────────────────────────────────────

export type ClockInInput = {
  shift_id?: string;
  // Free-form payload accepted by the backend and stored on the time-clock
  // event for audit purposes (e.g. geolocation, device id).
  metadata?: Record<string, unknown>;
};

export type ClockInResponse = {
  data: {
    shift: StaffShift;
  };
};

export type ClockOutResponse = {
  data: {
    shift: StaffShift;
    worked_minutes: number;
  };
};

// ─── /staff/shifts ───────────────────────────────────────────────────────────

export type ListStaffShiftsParams = {
  per_page?: number;
  page?: number;
  from?: string;
  to?: string;
};

// ─── /staff/breaks ───────────────────────────────────────────────────────────

export type StartBreakInput = {
  reason?: StaffBreakReason;
  notes?: string;
};

// ─── /staff/orders ───────────────────────────────────────────────────────────

export type ListMyOrdersParams = {
  /**
   * Comma-separated list of OrderStatus values, e.g. `"pending,preparing"`.
   * Kept as `string` because the backend splits on `,` and accepts any
   * subset.
   */
  status?: string;
  per_page?: number;
  page?: number;
};

/**
 * Distinct from `UpdateOrderStatusInput` in `./orders` — the staff variant
 * additionally accepts a `reason` (required when transitioning to
 * `cancelled`).
 */
export type UpdateStaffOrderStatusInput = {
  status: OrderStatus;
  reason?: string;
};

export type UpdateItemStatus = 'preparing' | 'ready' | 'served';

export type UpdateItemStatusInput = {
  status: UpdateItemStatus;
};

// ─── /staff/kitchen/queue ────────────────────────────────────────────────────

/**
 * Status values an order item may carry while moving through the kitchen.
 * Backend stores it as a free string column, but in practice these are the
 * only values produced by the workflow (see UpdateOrderItemStatusAction).
 */
export type KitchenItemStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled';

export type KitchenOrderItem = {
  id: string;
  name: string;
  quantity: number;
  status: KitchenItemStatus;
  notes: string | null;
  /**
   * The backend serialises whatever JSON sits on `order_items.modifiers`.
   * The shape is the same one used elsewhere in the API.
   */
  modifiers: OrderItemModifier[];
  started_preparing_at: string | null;
  ready_at: string | null;
  prep_duration_seconds: number | null;
  cook_id: string | null;
  cook_name: string | null;
};

export type KitchenOrder = {
  id: string;
  order_no: string;
  table_name: string | null;
  type: string;
  status: OrderStatus;
  elapsed_seconds: number;
  placed_at: string | null;
  notes: string | null;
  items: KitchenOrderItem[];
};

export type ListKitchenQueueParams = {
  per_page?: number;
};

// ─── /staff/stats ────────────────────────────────────────────────────────────

export type StaffStatsPeriod = 'today' | 'week' | 'month';

export type StaffStats = {
  period: StaffStatsPeriod;
  from: string;
  to: string;
  orders_count: number;
  revenue_minor: number;
  tips_minor: number;
  avg_order_minor: number;
  shift_minutes: number;
  items_prepared: number;
};

export type StaffStatsParams = {
  period?: StaffStatsPeriod;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (
  params: Record<string, unknown> | undefined,
): string => {
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
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const staffApi = {
  // Auth
  login: (client: MyPosApiClient, input: StaffLoginInput) =>
    client.post<StaffLoginResponse>('/api/v1/auth/staff-login', input),

  me: (client: MyPosApiClient) =>
    client.get<StaffMeResponse>('/api/v1/staff/me'),

  // Clock in/out
  clockIn: (client: MyPosApiClient, input: ClockInInput = {}) =>
    client.post<ClockInResponse>('/api/v1/staff/clock-in', input),

  clockOut: (client: MyPosApiClient) =>
    client.post<ClockOutResponse>('/api/v1/staff/clock-out', {}),

  // Shifts
  currentShift: (client: MyPosApiClient) =>
    client.get<{ data: StaffShift | null }>('/api/v1/staff/shifts/current'),

  shifts: (client: MyPosApiClient, params?: ListStaffShiftsParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<StaffShift>>(
      `/api/v1/staff/shifts${qs}`,
    );
  },

  // Breaks
  startBreak: (client: MyPosApiClient, input: StartBreakInput = {}) =>
    client.post<ResourceResponse<StaffShiftBreak>>(
      '/api/v1/staff/breaks/start',
      input,
    ),

  endBreak: (client: MyPosApiClient) =>
    client.post<ResourceResponse<StaffShiftBreak>>(
      '/api/v1/staff/breaks/end',
      {},
    ),

  // Orders (waiter)
  myOrders: (client: MyPosApiClient, params?: ListMyOrdersParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<Order>>(
      `/api/v1/staff/orders/my${qs}`,
    );
  },

  createOrder: (client: MyPosApiClient, input: CreateOrderInput) =>
    client.post<ResourceResponse<Order>>('/api/v1/staff/orders', input),

  updateOrderStatus: (
    client: MyPosApiClient,
    orderId: string,
    input: UpdateStaffOrderStatusInput,
  ) =>
    client.patch<ResourceResponse<Order>>(
      `/api/v1/staff/orders/${orderId}/status`,
      input,
    ),

  // Kitchen (cook)
  kitchenQueue: (client: MyPosApiClient, params?: ListKitchenQueueParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<KitchenOrder>>(
      `/api/v1/staff/kitchen/queue${qs}`,
    );
  },

  updateItemStatus: (
    client: MyPosApiClient,
    orderId: string,
    itemId: string,
    input: UpdateItemStatusInput,
  ) =>
    client.patch<ResourceResponse<OrderItem>>(
      `/api/v1/staff/orders/${orderId}/items/${itemId}/status`,
      input,
    ),

  // Stats
  stats: (client: MyPosApiClient, params: StaffStatsParams = {}) => {
    const qs = buildQueryString(params);
    return client.get<{ data: StaffStats }>(`/api/v1/staff/stats${qs}`);
  },
};

// Re-export `CollectionResponse` so consumers needing the generic envelope
// can import it from this module without a separate `./menu` import.
export type { CollectionResponse };
