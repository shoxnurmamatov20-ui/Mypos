import type { MyPosApiClient } from './client';
import type { ResourceResponse } from './menu';

export type OrdersByStatus = {
  pending: number;
  preparing: number;
  ready: number;
  served: number;
  completed: number;
  cancelled: number;
};

export type DailyRevenuePoint = {
  date: string; // YYYY-MM-DD
  orders: number;
  revenue: number;
};

export type TopItem = {
  menu_item_id: string | null;
  name: string;
  count: number;
  revenue: number;
};

export type TopTable = {
  table_id: string | null;
  name: string;
  orders: number;
  revenue: number;
};

export type PaymentMethodStat = {
  method: string;
  count: number;
  revenue: number;
};

export type OrderSummary = {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_by_status: OrdersByStatus;
  daily_revenue: DailyRevenuePoint[];
  top_items: TopItem[];
  top_tables: TopTable[];
  payment_methods: PaymentMethodStat[];
};

export type SummaryParams = {
  from?: string;
  to?: string;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
  );
};

export const statsApi = {
  summary: (client: MyPosApiClient, params?: SummaryParams) => {
    const qs = buildQueryString(params);
    return client.get<ResourceResponse<OrderSummary>>(
      `/api/v1/orders/stats/summary${qs}`,
    );
  },
};
