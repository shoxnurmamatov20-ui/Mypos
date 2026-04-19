import type { UUID, ISO8601 } from './common';

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

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'click' | 'payme' | 'uzum' | 'apelsin' | 'gift_card';

export type OrderItem = {
  id: UUID;
  orderId: UUID;
  menuItemId: UUID;
  variantId?: UUID;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  modifiers: Array<{ id: UUID; name: string; priceDelta: number }>;
  notes?: string;
  status: OrderStatus;
};

export type Order = {
  id: UUID;
  tenantId: UUID;
  locationId: UUID;
  orderNo: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerId?: UUID;
  tableId?: UUID;
  employeeId?: UUID;
  guestCount?: number;
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  paidAmount: number;
  items: OrderItem[];
  notes?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};
