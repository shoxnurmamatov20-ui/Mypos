import type { MyPosApiClient } from './client';
import type { PaginatedResponse, ResourceResponse } from './menu';
import type { OrderItemModifier } from './orders';

// ─── Address ─────────────────────────────────────────────────────────────────

/**
 * Backend stores `orders.delivery_address` as a free-form JSONB column
 * (`array<string, mixed>|null`) — there is no enforced schema. The mobile
 * apps populate the structured fields below when collecting an address, but
 * older orders may carry an arbitrary subset (or extra keys), so every field
 * is optional and we keep an index signature to forward unknown keys.
 *
 * NOTE: name is `CourierDeliveryAddress` (not `DeliveryAddress`) to avoid a
 * collision with future address types in other modules.
 */
export type CourierDeliveryAddress = {
  street?: string | null;
  city?: string | null;
  district?: string | null;
  apartment?: string | null;
  building?: string | null;
  entrance?: string | null;
  floor?: string | null;
  landmark?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  phone?: string | null;
  [key: string]: unknown;
};

// ─── Enums (string unions) ───────────────────────────────────────────────────

/**
 * UI-friendly state derived by the backend from delivery timestamps. Mirrors
 * `ActiveDeliveryResource::deriveCourierState()` — `Order.status` itself
 * stays at `ready` until completion, so the app reads `derived_state`.
 */
export type DeliveryDerivedState = 'awaiting_pickup' | 'delivering' | 'delivered' | 'cancelled';

/**
 * Cancellation reasons accepted by the cancel endpoint
 * (App\Domain\Employee\Enums\DeliveryCancelReason).
 */
export type DeliveryCancelReason =
  | 'customer_unavailable'
  | 'wrong_address'
  | 'vehicle_breakdown'
  | 'other';

/**
 * Payment methods accepted on delivery completion (DeliverOrderRequest).
 */
export type CourierPaymentMethod = 'cash' | 'card' | 'click' | 'payme';

export type CourierEarningsPeriod = 'today' | 'week' | 'month';

// ─── Resource: AvailableOrder ────────────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\Api\V1\Staff\Courier\AvailableOrderResource`.
 *
 * NOTE: `total_amount` is emitted by Laravel's money/decimal cast as a
 * **string** (e.g. `"125000.00"`). We type it as `string | number` because
 * different code paths (factories vs. live API) may serialise it either way.
 */
export type AvailableOrder = {
  id: string;
  order_no: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: CourierDeliveryAddress | null;
  delivery_notes: string | null;
  items_count: number;
  items_preview: string[];
  total_amount: string | number;
  currency: string;
  delivery_fee_minor: number;
  courier_earnings_minor: number;
  estimated_distance_meters: number | null;
  ready_at: string | null;
  elapsed_since_ready_seconds: number;
  payment_status: string;
  payment_method: string | null;
};

// ─── Resource: ActiveDelivery ────────────────────────────────────────────────

export type ActiveDeliveryCustomer = {
  id: string;
  name: string;
  phone: string | null;
};

export type ActiveDeliveryItem = {
  id: string;
  name: string;
  quantity: number;
  modifiers: OrderItemModifier[];
  notes: string | null;
};

export type ActiveDeliveryAmounts = {
  subtotal: string | number;
  total: string | number;
  paid: string | number;
  currency: string;
  delivery_fee_minor: number;
  courier_earnings_minor: number;
};

export type ActiveDeliveryTimestamps = {
  placed_at: string | null;
  prepared_at: string | null;
  picked_up_at: string | null;
  delivering_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
};

/**
 * Mirrors `App\Http\Resources\Api\V1\Staff\Courier\ActiveDeliveryResource`.
 *
 * NOTE: monetary fields inside `amounts` are emitted as strings by Laravel's
 * decimal/money cast (same as AvailableOrder.total_amount) — the union
 * `string | number` keeps factories and the live API both type-safe.
 */
export type ActiveDelivery = {
  id: string;
  order_no: string;
  status: string;
  derived_state: DeliveryDerivedState;
  customer: ActiveDeliveryCustomer | null;
  delivery_address: CourierDeliveryAddress | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  items: ActiveDeliveryItem[];
  amounts: ActiveDeliveryAmounts;
  payment_status: string;
  payment_method: string | null;
  distance_meters: number | null;
  timestamps: ActiveDeliveryTimestamps;
};

// ─── Resource: DeliveryHistoryItem ───────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\Api\V1\Staff\Courier\DeliveryHistoryResource`.
 *
 * NOTE: backend emits `duration_seconds` (NOT `duration_minutes`) and a
 * `total_amount` string with separate `currency` field. `tip_minor` mirrors
 * the column `tip_amount` (already in minor units in this codebase).
 */
export type DeliveryHistoryItem = {
  id: string;
  order_no: string;
  customer_name: string | null;
  delivery_address: CourierDeliveryAddress | null;
  total_amount: string | number;
  currency: string;
  courier_earnings_minor: number;
  delivery_fee_minor: number;
  distance_meters: number | null;
  duration_seconds: number | null;
  tip_minor: number;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
};

// ─── Resource: CourierEarnings ───────────────────────────────────────────────

export type CourierEarningsDayBreakdown = {
  date: string;
  deliveries: number;
  earnings_minor: number;
};

/**
 * Mirrors the array returned by
 * `App\Domain\Employee\Actions\ComputeCourierEarningsAction`. The Resource
 * (`CourierEarningsResource`) is a passthrough.
 *
 * NOTE: `from`/`to` are full ISO 8601 strings (start/end of period), not
 * just date strings.
 */
export type CourierEarnings = {
  period: CourierEarningsPeriod;
  from: string;
  to: string;
  deliveries_count: number;
  total_earnings_minor: number;
  tips_minor: number;
  avg_per_delivery_minor: number;
  total_distance_meters: number;
  active_minutes: number;
  by_day: CourierEarningsDayBreakdown[];
};

// ─── Inputs ──────────────────────────────────────────────────────────────────

/**
 * Body for POST /api/v1/staff/courier/orders/{order}/deliver.
 *
 * NOTE: backend validates `received_amount` as `integer` (i.e. minor units),
 * not a decimal. Pass cents/tiyin, never a formatted price.
 */
export type DeliverOrderInput = {
  received_amount?: number;
  payment_method?: CourierPaymentMethod;
};

export type CancelDeliveryInput = {
  reason: DeliveryCancelReason;
  notes?: string;
};

export type RecordLocationInput = {
  lat: number;
  lng: number;
  accuracy_meters?: number;
  heading?: number;
  speed_mps?: number;
  battery_percent?: number;
  order_id?: string;
  recorded_at?: string;
};

export type ListCourierAvailableParams = {
  per_page?: number;
  page?: number;
};

export type ListCourierHistoryParams = {
  per_page?: number;
  page?: number;
  from?: string;
  to?: string;
};

export type CourierEarningsParams = {
  period?: CourierEarningsPeriod;
};

// ─── Response shells ─────────────────────────────────────────────────────────

/**
 * The location endpoint returns 201 with `{ data: { id } }` — never 204.
 */
export type RecordLocationResponse = {
  data: { id: string };
};

export type ActiveDeliveryResponse = {
  data: ActiveDelivery | null;
};

export type CourierEarningsResponse = {
  data: CourierEarnings;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const courierApi = {
  /** GET /api/v1/staff/courier/available */
  available: (client: MyPosApiClient, params?: ListCourierAvailableParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<AvailableOrder>>(`/api/v1/staff/courier/available${qs}`);
  },

  /** POST /api/v1/staff/courier/orders/{order}/accept */
  accept: (client: MyPosApiClient, orderId: string) =>
    client.post<ResourceResponse<ActiveDelivery>>(
      `/api/v1/staff/courier/orders/${orderId}/accept`,
      {},
    ),

  /** POST /api/v1/staff/courier/orders/{order}/pickup */
  pickup: (client: MyPosApiClient, orderId: string) =>
    client.post<ResourceResponse<ActiveDelivery>>(
      `/api/v1/staff/courier/orders/${orderId}/pickup`,
      {},
    ),

  /** POST /api/v1/staff/courier/orders/{order}/deliver */
  deliver: (client: MyPosApiClient, orderId: string, input: DeliverOrderInput = {}) =>
    client.post<ResourceResponse<ActiveDelivery>>(
      `/api/v1/staff/courier/orders/${orderId}/deliver`,
      input,
    ),

  /** POST /api/v1/staff/courier/orders/{order}/cancel */
  cancel: (client: MyPosApiClient, orderId: string, input: CancelDeliveryInput) =>
    client.post<ResourceResponse<ActiveDelivery>>(
      `/api/v1/staff/courier/orders/${orderId}/cancel`,
      input,
    ),

  /** POST /api/v1/staff/courier/location — hot path (~10 s/courier). */
  recordLocation: (client: MyPosApiClient, input: RecordLocationInput) =>
    client.post<RecordLocationResponse>('/api/v1/staff/courier/location', input),

  /** GET /api/v1/staff/courier/active */
  active: (client: MyPosApiClient) =>
    client.get<ActiveDeliveryResponse>('/api/v1/staff/courier/active'),

  /** GET /api/v1/staff/courier/history */
  history: (client: MyPosApiClient, params?: ListCourierHistoryParams) => {
    const qs = buildQueryString(params);
    return client.get<PaginatedResponse<DeliveryHistoryItem>>(`/api/v1/staff/courier/history${qs}`);
  },

  /** GET /api/v1/staff/courier/earnings */
  earnings: (client: MyPosApiClient, params: CourierEarningsParams = {}) => {
    const qs = buildQueryString(params);
    return client.get<CourierEarningsResponse>(`/api/v1/staff/courier/earnings${qs}`);
  },
};
