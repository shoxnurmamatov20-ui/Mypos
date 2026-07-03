import type { MyPosApiClient } from './client';
import type { ResourceResponse } from './menu';
import type {
  OrderItem,
  OrderItemModifier,
  OrderPaymentStatus,
  OrderStatus,
  OrderType,
} from './orders';
import type { Payment } from './payments';
import type { PublicMenuResponse } from './public';

/**
 * Self-service kiosk API — devices identify themselves with a long-lived
 * device token (issued at pairing). All endpoints below sit under
 * `/api/v1/kiosk/*`.
 *
 * The `pair` endpoint is public (rate-limited: 10 req / 15 min); every
 * other endpoint runs through the `kiosk.device` middleware which loads
 * the calling device into `request->attributes` so the controller can
 * scope queries by `tenant_id` + `kiosk_device_id`.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

/**
 * Lifecycle states for a kiosk device. Mirrors
 * `App\Domain\Kiosk\Enums\KioskDeviceStatus`.
 */
export type KioskDeviceStatus = 'unpaired' | 'paired' | 'disabled';

/**
 * Curated subset of payment providers the kiosk PWA can use. Mirrors
 * `CreateKioskPaymentRequest::rules()` — kiosks intentionally exclude
 * Uzum / Apelsin terminals unless explicitly enabled per deployment.
 */
export type KioskPaymentProvider = 'card' | 'click' | 'payme' | 'cash';

// ─── Resources ───────────────────────────────────────────────────────────────

/**
 * Public-facing kiosk device payload. Mirrors
 * `App\Http\Resources\V1\Kiosk\KioskDeviceResource` exactly — token hash is
 * never exposed; only the last 4 chars of the plaintext token are kept for
 * display in admin tools.
 */
export type KioskDevice = {
  id: string;
  tenant_id: string;
  name: string;
  location_label: string | null;
  status: KioskDeviceStatus;
  language: string;
  theme: string;
  idle_timeout_seconds: number;
  device_token_last4: string | null;
  device_info: Record<string, unknown> | null;
  paired_at: string | null;
  last_seen_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Minimal tenant payload exposed to a paired kiosk device. Mirrors
 * `App\Http\Resources\V1\Kiosk\KioskTenantResource` — used by the kiosk PWA
 * to configure brand, language and currency right after pairing.
 */
export type KioskTenant = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  default_locale: string;
  default_currency: string;
  timezone: string;
};

/**
 * Kiosk-flavoured order resource — strips internal/staff-only fields like
 * `employee_id`, `customer_id`, `table_id`, `guest_count`, `tip` and adds the
 * kiosk session id so the device can reconcile its local state on a status
 * poll. Mirrors `App\Http\Resources\V1\Kiosk\KioskOrderResource`.
 */
export type KioskOrderAmounts = {
  subtotal: number;
  tax: number;
  discount: number;
  service_charge: number;
  total: number;
  paid: number;
  currency: string;
};

export type KioskOrder = {
  id: string;
  order_no: string;
  type: OrderType;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: string | null;
  kiosk_device_id: string | null;
  kiosk_session_id: string | null;
  customer_phone_for_receipt: string | null;
  amounts: KioskOrderAmounts;
  items: OrderItem[];
  notes: string | null;
  placed_at: string | null;
  prepared_at: string | null;
  served_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// ─── Response envelopes ──────────────────────────────────────────────────────

/**
 * The plaintext `device_token` is returned exactly once at pair time — the
 * kiosk app must persist it locally (SecureStore on native, localStorage on
 * web) because the backend stores only the SHA-256 hash and cannot reissue
 * it. Lose it and the device must re-pair from scratch.
 */
export type KioskPairResponse = {
  data: {
    device_token: string;
    device: KioskDevice;
    tenant: KioskTenant;
  };
};

export type KioskHeartbeatResponse = {
  data: {
    server_time: string;
    idle_timeout_seconds: number;
  };
};

export type CreateKioskPaymentResponse = {
  data: {
    payment: Payment;
    payment_url: string | null;
    transaction_id: string | null;
  };
};

// ─── Inputs ──────────────────────────────────────────────────────────────────

export type PairKioskDeviceInfo = {
  os?: string;
  app_version?: string;
  screen?: string;
  [key: string]: unknown;
};

export type PairKioskInput = {
  /** 6-digit pairing code printed in the admin UI. */
  code: string;
  device_name: string;
  device_info?: PairKioskDeviceInfo;
};

export type HeartbeatInput = {
  app_version?: string;
  /** 0 to 100. */
  battery_percent?: number;
  ip_address?: string;
  device_info?: Record<string, unknown>;
};

export type KioskOrderItemInput = {
  menu_item_id: string;
  quantity: number;
  notes?: string | null;
  modifiers?: OrderItemModifier[];
};

export type PlaceKioskOrderInput = {
  /** Optional UUID for client-side correlation. */
  session_id?: string;
  items: KioskOrderItemInput[];
  customer_phone_for_receipt?: string;
  notes?: string | null;
};

export type CreateKioskPaymentInput = {
  order_id: string;
  provider: KioskPaymentProvider;
};

export type KioskMenuParams = {
  /** ISO 639-1 (e.g. `uz`, `ru`, `en`). Only forwarded to backend if set. */
  locale?: string;
};

// ─── API ─────────────────────────────────────────────────────────────────────

const buildKioskMenuQuery = (params: KioskMenuParams): string =>
  params.locale ? `?locale=${encodeURIComponent(params.locale)}` : '';

export const kioskApi = {
  /**
   * Trade a pairing code for a long-lived device token. PUBLIC endpoint —
   * the API client must be configured WITHOUT a bearer token here.
   */
  pair: (client: MyPosApiClient, input: PairKioskInput) =>
    client.post<KioskPairResponse>('/api/v1/kiosk/pair', input),

  /**
   * Periodic heartbeat — refreshes `last_seen_at`, returns server time and
   * the latest idle-timeout window. Call every ~30s while the kiosk is idle.
   */
  heartbeat: (client: MyPosApiClient, input: HeartbeatInput = {}) =>
    client.post<KioskHeartbeatResponse>('/api/v1/kiosk/heartbeat', input),

  /**
   * Active menu for the kiosk's tenant. Same shape as
   * `/api/v1/public/menu/{slug}` so the kiosk PWA can reuse renderers.
   */
  menu: (client: MyPosApiClient, params: KioskMenuParams = {}) =>
    client.get<PublicMenuResponse>(`/api/v1/kiosk/menu${buildKioskMenuQuery(params)}`),

  /** Place an order from the kiosk. Backend dispatches `OrderPlaced` for KDS fan-out. */
  createOrder: (client: MyPosApiClient, input: PlaceKioskOrderInput) =>
    client.post<ResourceResponse<KioskOrder>>('/api/v1/kiosk/orders', input),

  /**
   * Poll an order's status. Returns 404 (not 403) for orders that don't
   * belong to the calling device, to avoid leaking cross-kiosk existence.
   */
  getOrder: (client: MyPosApiClient, orderId: string) =>
    client.get<ResourceResponse<KioskOrder>>(`/api/v1/kiosk/orders/${encodeURIComponent(orderId)}`),

  /**
   * Create a payment intent. For card/click/payme returns a `payment_url`
   * the kiosk should redirect to; for cash the call is a no-op until
   * `capturePayment` is invoked by the cashier.
   */
  createPayment: (client: MyPosApiClient, input: CreateKioskPaymentInput) =>
    client.post<CreateKioskPaymentResponse>('/api/v1/kiosk/payment-intent', input),

  /**
   * Mark a payment as captured. Backend returns the bare PaymentResource
   * (NOT wrapped in `{ payment: ... }`) since the controller returns the
   * resource directly — Laravel auto-wraps it as `{ data: <attrs> }`.
   */
  capturePayment: (client: MyPosApiClient, paymentId: string) =>
    client.post<ResourceResponse<Payment>>(
      `/api/v1/kiosk/payment-intent/${encodeURIComponent(paymentId)}/capture`,
      {},
    ),
};
