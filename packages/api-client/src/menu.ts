import type { MyPosApiClient } from './client';

export type TranslatedString = {
  uz: string;
  ru: string;
  en: string;
};

export type MenuCategory = {
  id: string;
  name: TranslatedString;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  items_count?: number;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  category_id: string;
  category?: MenuCategory;
  name: TranslatedString;
  description: TranslatedString | null;
  slug: string;
  sku: string | null;
  price: {
    amount: number;
    currency: string;
    effective_amount: number;
  };
  cost_amount: number | null;
  image_url: string | null;
  thumbnail_url: string | null;
  allergens: string[];
  tags: string[];
  calories: number | null;
  preparation_minutes: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  has_discount: boolean;
  discount_percent: number | null;
  stock_tracked: boolean;
  current_stock: number | null;
  low_stock_threshold: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CreateMenuCategoryInput = {
  name: TranslatedString;
  slug?: string;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
  parent_id?: string | null;
};

export type UpdateMenuCategoryInput = Partial<CreateMenuCategoryInput>;

export type CreateMenuItemInput = {
  category_id: string;
  name: TranslatedString;
  description?: TranslatedString | null;
  slug?: string;
  sku?: string | null;
  price_amount: number;
  price_currency?: string;
  cost_amount?: number | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  allergens?: string[];
  tags?: string[];
  calories?: number | null;
  preparation_minutes?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  has_discount?: boolean;
  discount_percent?: number | null;
  stock_tracked?: boolean;
  current_stock?: number | null;
  low_stock_threshold?: number | null;
  sort_order?: number;
};

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export type CollectionResponse<T> = { data: T[] };
export type ResourceResponse<T> = { data: T };
export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export const menuApi = {
  categories: {
    list: (client: MyPosApiClient, params?: { active_only?: boolean }) => {
      const qs = params?.active_only ? '?active_only=1' : '';
      return client.get<CollectionResponse<MenuCategory>>(
        `/api/v1/menu/categories${qs}`,
      );
    },
    create: (client: MyPosApiClient, input: CreateMenuCategoryInput) =>
      client.post<ResourceResponse<MenuCategory>>('/api/v1/menu/categories', input),
    update: (client: MyPosApiClient, id: string, input: UpdateMenuCategoryInput) =>
      client.patch<ResourceResponse<MenuCategory>>(`/api/v1/menu/categories/${id}`, input),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/menu/categories/${id}`),
  },
  items: {
    list: (
      client: MyPosApiClient,
      params?: { category_id?: string; active_only?: boolean; q?: string; per_page?: number },
    ) => {
      const qs = params
        ? '?' +
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&')
        : '';
      return client.get<PaginatedResponse<MenuItem>>(`/api/v1/menu/items${qs}`);
    },
    create: (client: MyPosApiClient, input: CreateMenuItemInput) =>
      client.post<ResourceResponse<MenuItem>>('/api/v1/menu/items', input),
    update: (client: MyPosApiClient, id: string, input: UpdateMenuItemInput) =>
      client.patch<ResourceResponse<MenuItem>>(`/api/v1/menu/items/${id}`, input),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/menu/items/${id}`),
  },
};
