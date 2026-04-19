import type { UUID, ISO8601, Translated, MoneyAmount } from './common';

export type MenuCategory = {
  id: UUID;
  locationId: UUID;
  name: Translated;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
};

export type MenuItem = {
  id: UUID;
  locationId: UUID;
  categoryId: UUID;
  name: Translated;
  description: Translated;
  price: MoneyAmount;
  costAmount?: number;
  imageUrl?: string;
  allergens: string[];
  calories?: number;
  isActive: boolean;
  stockTracked: boolean;
  currentStock?: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type MenuVariant = {
  id: UUID;
  itemId: UUID;
  name: Translated;
  priceDelta: number;
};

export type MenuModifier = {
  id: UUID;
  itemId: UUID;
  name: Translated;
  required: boolean;
  min: number;
  max: number;
  options: MenuModifierOption[];
};

export type MenuModifierOption = {
  id: UUID;
  modifierId: UUID;
  name: Translated;
  priceDelta: number;
};
