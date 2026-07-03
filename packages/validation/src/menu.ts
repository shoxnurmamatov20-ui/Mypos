import { z } from 'zod';
import { MoneyAmountSchema, TranslatedSchema, UUIDSchema } from './common';

export const CreateMenuCategorySchema = z.object({
  locationId: UUIDSchema,
  name: TranslatedSchema,
  icon: z.string().max(64).optional(),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateMenuCategoryInput = z.infer<typeof CreateMenuCategorySchema>;

export const CreateMenuItemSchema = z.object({
  locationId: UUIDSchema,
  categoryId: UUIDSchema,
  name: TranslatedSchema,
  description: TranslatedSchema.optional(),
  price: MoneyAmountSchema,
  costAmount: z.number().int().min(0).optional(),
  allergens: z.array(z.string()).default([]),
  calories: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  stockTracked: z.boolean().default(false),
  initialStock: z.number().int().min(0).optional(),
});
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial().extend({
  id: UUIDSchema,
});
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
