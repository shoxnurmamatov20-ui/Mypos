import type { MyPosApiClient } from './client';
import type { CollectionResponse, ResourceResponse } from './menu';
import type { Table } from './tables';

export type OrderType =
  | 'dine_in'
  | 'takeaway'
  | 'delivery'
  | 'kiosk'
  | 'qr_menu'
  | 'telegram'
  | 'marketplace';

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refunded'
  | 'void';

export type OrderItemModifier = {
  id: string;
  name: string;
  price_delta: number;
};

export type OrderItem = {
  id: string;
  menu_item_id: string;
  name: string;
  price_amount: number;
  quantity: number;
  subtotal_amount: number;
  currency: string;
  modifiers: OrderItemModifier[];
  notes: string | null;
  status: string;
  created_at: string;
};

export type OrderAmounts = {
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  service_charge: number;
  total: number;
  paid: number;
  currency: string;
};

export type Order = {
  id: string;
  order_no: string;
  type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  table_id: string | null;
  table?: Table | null;
  customer_id: string | null;
  employee_id: string | null;
  guest_count: number | null;
  amounts: OrderAmounts;
  notes: string | null;
  items: OrderItem[];
  placed_at: string | null;
  prepared_at: string | null;
  served_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateOrderItemInput = {
  menu_item_id: string;
  quantity: number;
  notes?: string | null;
  modifiers?: OrderItemModifier[];
};

export type CreateOrderInput = {
  type?: OrderType;
  table_id?: string | null;
  customer_id?: string | null;
  guest_count?: number | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
};

export type ListOrdersParams = {
  status?: OrderStatus;
  table_id?: string;
  active_only?: boolean;
  per_page?: number;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
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

export const ordersApi = {
  list: (client: MyPosApiClient, params?: ListOrdersParams) => {
    const qs = buildQueryString(params);
    return client.get<CollectionResponse<Order>>(`/api/v1/orders${qs}`);
  },
  show: (client: MyPosApiClient, id: string) =>
    client.get<ResourceResponse<Order>>(`/api/v1/orders/${id}`),
  create: (client: MyPosApiClient, input: CreateOrderInput) =>
    client.post<ResourceResponse<Order>>('/api/v1/orders', input),
  updateStatus: (
    client: MyPosApiClient,
    id: string,
    input: UpdateOrderStatusInput,
  ) =>
    client.patch<ResourceResponse<Order>>(
      `/api/v1/orders/${id}/status`,
      input,
    ),
};
