import type { MyPosApiClient } from './client';
import type { PaginatedResponse } from './menu';
import type { OrderPaymentStatus, OrderStatus, OrderType } from './orders';

/**
 * Reports module — read-only aggregations consumed by manager / dashboard
 * surfaces. Every endpoint is `auth:sanctum` + tenant-scoped + GET-only.
 *
 * Money is returned in minor units (integer; UZS so'm × 1). Quantities are
 * floats (decimal:3). Dates are ISO 8601 strings; nullable when absent.
 */

// ─── Z-Report ──────────────────────────────────────────────────────────────

export type ZReportPayment = {
  provider: string;
  count: number;
  amount_minor: number;
  percent: number;
};

export type ZReportTopItem = {
  menu_item_id: string | null;
  name: string;
  quantity_sold: number;
  revenue_minor: number;
};

export type ZReportTopWaiter = {
  employee_id: string | null;
  name: string;
  orders_count: number;
  revenue_minor: number;
};

export type ZReportCancellationReason = {
  reason: string;
  count: number;
};

export type ZReportCancellations = {
  count: number;
  reasons: ZReportCancellationReason[];
  estimated_loss_minor: number;
};

export type ZReportShifts = {
  open_count: number;
  closed_count: number;
};

export type ZReportTotals = {
  orders_count: number;
  revenue_minor: number;
  tax_minor: number;
  discount_minor: number;
  net_revenue_minor: number;
  avg_ticket_minor: number;
};

export type ZReportByType = {
  count: number;
  revenue_minor: number;
};

export type ZReport = {
  date: string;
  totals: ZReportTotals;
  by_status: Partial<Record<OrderStatus, number>>;
  by_type: Partial<Record<OrderType, ZReportByType>>;
  payments: ZReportPayment[];
  top_items: ZReportTopItem[];
  top_waiters: ZReportTopWaiter[];
  cancellations: ZReportCancellations;
  shifts: ZReportShifts;
};

export type ZReportParams = {
  date?: string;
};

// ─── Orders Report ─────────────────────────────────────────────────────────

export type OrdersReportItem = {
  id: string;
  order_no: string;
  type: OrderType;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: string | null;
  guest_count: number | null;
  table?: { id: string; name: string } | null;
  waiter?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  amounts: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paid: number;
    currency: string;
  };
  placed_at: string | null;
  served_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
};

export type OrdersReportSummary = {
  count: number;
  revenue_minor: number;
  avg_ticket_minor: number;
};

export type OrdersReportResponse = PaginatedResponse<OrdersReportItem> & {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary: OrdersReportSummary;
  };
};

export type OrdersReportParams = {
  from?: string;
  to?: string;
  status?: OrderStatus;
  type?: OrderType;
  table_id?: string;
  employee_id?: string;
  payment_method?: string;
  q?: string;
  page?: number;
  per_page?: number;
  sort?: string;
};

// ─── Date-Range base ───────────────────────────────────────────────────────

export type DateRangeParams = {
  from?: string;
  to?: string;
  sort?: string;
};

// ─── Tables Report ─────────────────────────────────────────────────────────

export type TablesReportRow = {
  table_id: string;
  name: string;
  category: string;
  orders_count: number;
  revenue_minor: number;
  guests_total: number;
  avg_ticket_minor: number;
  occupancy_minutes: number;
  last_used_at: string | null;
};

export type TablesReportResponse = {
  data: TablesReportRow[];
  meta: {
    total_tables: number;
    active_tables: number;
    total_revenue_minor: number;
  };
};

// ─── Waiters Report ────────────────────────────────────────────────────────

export type WaitersReportRow = {
  employee_id: string;
  name: string;
  position: string;
  orders_count: number;
  revenue_minor: number;
  guests_total: number;
  avg_ticket_minor: number;
  tips_minor: number;
  last_used_at: string | null;
};

export type WaitersReportResponse = {
  data: WaitersReportRow[];
  meta: {
    employees_count: number;
    total_revenue_minor: number;
    total_orders_count: number;
  };
};

// ─── Courier Report ────────────────────────────────────────────────────────

export type CourierReportRow = {
  courier_id: string;
  name: string;
  deliveries_count: number;
  revenue_delivered_minor: number;
  avg_delivery_minutes: number;
  total_distance_km?: number;
  tips_minor: number;
};

export type CourierReportLockedMeta = {
  locked: true;
  reason: 'tier_upgrade_required';
  required_tier: string;
};

export type CourierReportUnlockedMeta = {
  locked: false;
  couriers_count: number;
  total_deliveries: number;
  total_revenue_minor: number;
};

export type CourierReportResponse = {
  data: CourierReportRow[];
  meta: CourierReportLockedMeta | CourierReportUnlockedMeta | { locked: false };
};

// ─── Menu Items Report ─────────────────────────────────────────────────────

export type MenuItemsReportRow = {
  menu_item_id: string | null;
  name: string;
  category_id: string | null;
  category_name: string;
  quantity_sold: number;
  revenue_minor: number;
  cost_minor: number;
  gross_profit_minor: number;
  orders_count: number;
  cancelled_quantity: number;
};

export type MenuItemsReportResponse = {
  data: MenuItemsReportRow[];
  meta: {
    total_items_sold: number;
    total_revenue_minor: number;
    total_profit_minor: number;
  };
};

export type MenuItemsReportParams = DateRangeParams & {
  category_id?: string;
  sort?:
    | '-revenue'
    | '-quantity'
    | '-profit'
    | '-cancelled'
    | 'revenue'
    | 'quantity'
    | 'profit'
    | 'cancelled'
    | string;
};

// ─── Cancelled Report ──────────────────────────────────────────────────────

export type CancelledOrderRow = {
  order_id: string;
  order_no: string;
  table_name: string | null;
  waiter_name: string | null;
  cancelled_at: string | null;
  cancel_reason: string;
  total_minor: number;
  items_count: number;
};

export type CancelledItemRow = {
  order_id: string;
  order_no: string;
  menu_item_name: string;
  quantity: number;
  unit_price_minor: number;
  total_loss_minor: number;
  cancel_reason: string;
};

export type CancelledReasonRow = {
  reason: string;
  count: number;
  loss_minor: number;
};

export type CancelledReport = {
  data: {
    orders: CancelledOrderRow[];
    items: CancelledItemRow[];
    summary: {
      orders_count: number;
      items_count: number;
      total_loss_minor: number;
    };
    by_reason: CancelledReasonRow[];
  };
};

// ─── Debtors Report ────────────────────────────────────────────────────────

export type DebtorRow = {
  customer_id: string;
  name: string;
  phone: string | null;
  orders_count: number;
  total_owed_minor: number;
  oldest_unpaid_date: string | null;
};

export type CreditorRow = {
  // Reserved shape — backend currently returns `[]`; field shape will land
  // with the future Expense / Supplier-debt module.
  [key: string]: unknown;
};

export type DebtorsReport = {
  data: {
    debtors: DebtorRow[];
    creditors: CreditorRow[];
    summary: {
      debtors_total_minor: number;
      creditors_total_minor: number;
      net_minor: number;
    };
  };
};

// ─── Cashflow Report ───────────────────────────────────────────────────────

export type CashflowSeriesPoint = {
  period: string;
  inflow_minor: number;
  outflow_minor: number;
  net_minor: number;
  transactions: number;
};

export type CashflowByProvider = {
  provider: string;
  amount_minor: number;
  count: number;
  percent: number;
};

export type CashflowReport = {
  data: {
    series: CashflowSeriesPoint[];
    by_provider: CashflowByProvider[];
    summary: {
      total_inflow_minor: number;
      total_outflow_minor: number;
      net_minor: number;
      transaction_count: number;
      avg_transaction_minor: number;
    };
  };
};

export type CashflowReportParams = DateRangeParams & {
  group_by?: 'day' | 'week' | 'month';
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const toQueryString = (
  params?: Record<string, string | number | boolean | undefined | null>,
): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

// ─── API ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  zReport: (client: MyPosApiClient, params?: ZReportParams) =>
    client.get<{ data: ZReport }>(`/api/v1/reports/z-report${toQueryString(params)}`),

  orders: (client: MyPosApiClient, params?: OrdersReportParams) =>
    client.get<OrdersReportResponse>(`/api/v1/reports/orders${toQueryString(params)}`),

  tables: (client: MyPosApiClient, params?: DateRangeParams) =>
    client.get<TablesReportResponse>(`/api/v1/reports/tables${toQueryString(params)}`),

  waiters: (client: MyPosApiClient, params?: DateRangeParams) =>
    client.get<WaitersReportResponse>(`/api/v1/reports/waiters${toQueryString(params)}`),

  courier: (client: MyPosApiClient, params?: DateRangeParams) =>
    client.get<CourierReportResponse>(`/api/v1/reports/courier${toQueryString(params)}`),

  menuItems: (client: MyPosApiClient, params?: MenuItemsReportParams) =>
    client.get<MenuItemsReportResponse>(`/api/v1/reports/menu-items${toQueryString(params)}`),

  cancelled: (client: MyPosApiClient, params?: DateRangeParams) =>
    client.get<CancelledReport>(`/api/v1/reports/cancelled${toQueryString(params)}`),

  debtors: (client: MyPosApiClient, params?: DateRangeParams) =>
    client.get<DebtorsReport>(`/api/v1/reports/debtors${toQueryString(params)}`),

  cashflow: (client: MyPosApiClient, params?: CashflowReportParams) =>
    client.get<CashflowReport>(`/api/v1/reports/cashflow${toQueryString(params)}`),
};
