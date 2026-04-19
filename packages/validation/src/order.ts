import { z } from 'zod';
import { UUIDSchema } from './common';

export const OrderTypeSchema = z.enum([
  'dine_in',
  'takeaway',
  'delivery',
  'kiosk',
  'qr_menu',
  'telegram',
  'marketplace',
]);

export const CreateOrderItemSchema = z.object({
  menuItemId: UUIDSchema,
  variantId: UUIDSchema.optional(),
  quantity: z.number().int().min(1).max(999),
  modifierOptionIds: z.array(UUIDSchema).default([]),
  notes: z.string().max(500).optional(),
});

export const CreateOrderSchema = z.object({
  locationId: UUIDSchema,
  type: OrderTypeSchema,
  tableId: UUIDSchema.optional(),
  customerId: UUIDSchema.optional(),
  guestCount: z.number().int().min(1).max(50).optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'Kamida 1 ta mahsulot kerak'),
  notes: z.string().max(1000).optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled']),
  note: z.string().max(500).optional(),
});
