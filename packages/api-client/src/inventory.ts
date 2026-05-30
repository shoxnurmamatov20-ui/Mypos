import type { MyPosApiClient } from './client';
import type {
  CollectionResponse,
  PaginatedResponse,
  ResourceResponse,
  TranslatedString,
} from './menu';

export type StockMovementReason =
  | 'order_consume'
  | 'purchase'
  | 'adjust'
  | 'waste'
  | 'transfer';

export type IngredientCategory = {
  id: string;
  name: TranslatedString;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Ingredient = {
  id: string;
  category_id: string | null;
  category?: IngredientCategory;
  name: TranslatedString;
  sku: string | null;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_stock: number | null;
  reorder_point: number | null;
  is_active: boolean;
  low_stock: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Recipe = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity: number;
  unit: string;
  is_optional: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type StockMovement = {
  id: string;
  ingredient_id: string;
  delta: number;
  balance_after: number;
  reason: StockMovementReason | string;
  reason_label: string | null;
  reference_type: string | null;
  reference_id: string | null;
  cost_per_unit: number | null;
  notes: string | null;
  recorded_at: string | null;
  created_by: string | null;
  created_at: string | null;
};

export type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateIngredientInput = {
  category_id?: string | null;
  name: TranslatedString;
  sku?: string | null;
  unit: string;
  cost_per_unit: number;
  current_stock?: number | null;
  initial_stock?: number | null;
  min_stock?: number | null;
  reorder_point?: number | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type UpdateIngredientInput = Partial<CreateIngredientInput>;

export type CreateRecipeInput = {
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  is_optional?: boolean;
};

export type StockAdjustmentInput = {
  delta: number;
  reason: StockMovementReason;
  cost_per_unit?: number | null;
  notes?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
};

export type ValuationItem = {
  ingredient_id: string;
  name: TranslatedString;
  unit: string;
  current_stock: number;
  cost_per_unit: number;
  value: number;
};

export type ValuationResponse = {
  data: {
    items: ValuationItem[];
    total_value: number;
    currency: string;
  };
};

const toQueryString = (params?: Record<string, string | number | boolean | undefined | null>): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const inventoryApi = {
  categories: {
    list: (client: MyPosApiClient) =>
      client.get<CollectionResponse<IngredientCategory>>('/api/v1/inventory/categories'),
    create: (
      client: MyPosApiClient,
      input: { name: TranslatedString; sort_order?: number },
    ) =>
      client.post<ResourceResponse<IngredientCategory>>(
        '/api/v1/inventory/categories',
        input,
      ),
    update: (
      client: MyPosApiClient,
      id: string,
      input: { name?: TranslatedString; sort_order?: number },
    ) =>
      client.patch<ResourceResponse<IngredientCategory>>(
        `/api/v1/inventory/categories/${id}`,
        input,
      ),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/inventory/categories/${id}`),
  },
  ingredients: {
    list: (
      client: MyPosApiClient,
      params?: {
        q?: string;
        category_id?: string;
        active_only?: boolean;
        low_stock?: boolean;
        per_page?: number;
      },
    ) =>
      client.get<PaginatedResponse<Ingredient>>(
        `/api/v1/inventory/ingredients${toQueryString(params)}`,
      ),
    get: (client: MyPosApiClient, id: string) =>
      client.get<ResourceResponse<Ingredient>>(`/api/v1/inventory/ingredients/${id}`),
    create: (client: MyPosApiClient, input: CreateIngredientInput) =>
      client.post<ResourceResponse<Ingredient>>('/api/v1/inventory/ingredients', input),
    update: (client: MyPosApiClient, id: string, input: UpdateIngredientInput) =>
      client.patch<ResourceResponse<Ingredient>>(`/api/v1/inventory/ingredients/${id}`, input),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/inventory/ingredients/${id}`),
  },
  recipes: {
    list: (client: MyPosApiClient, params?: { menu_item_id?: string; ingredient_id?: string }) =>
      client.get<CollectionResponse<Recipe>>(
        `/api/v1/inventory/recipes${toQueryString(params)}`,
      ),
    create: (client: MyPosApiClient, input: CreateRecipeInput) =>
      client.post<ResourceResponse<Recipe>>('/api/v1/inventory/recipes', input),
    delete: (client: MyPosApiClient, id: string) =>
      client.delete<{ data: { message: string } }>(`/api/v1/inventory/recipes/${id}`),
  },
  movements: {
    list: (
      client: MyPosApiClient,
      ingredientId: string,
      params?: { reason?: StockMovementReason; per_page?: number },
    ) =>
      client.get<PaginatedResponse<StockMovement>>(
        `/api/v1/inventory/ingredients/${ingredientId}/movements${toQueryString(params)}`,
      ),

    /** Flat list of movements across ALL ingredients (manager panel). */
    listAll: (
      client: MyPosApiClient,
      params?: {
        reason?: StockMovementReason | string;
        ingredient_id?: string;
        reference_type?: string;
        date_from?: string;
        date_to?: string;
        sort?: 'recorded_at' | '-recorded_at' | 'created_at' | '-created_at';
        per_page?: number;
        page?: number;
      },
    ) =>
      client.get<
        PaginatedResponse<
          StockMovement & {
            ingredient?: {
              id: string;
              name: TranslatedString;
              unit: string;
              cost_per_unit: number;
              sku: string | null;
            };
          }
        >
      >(`/api/v1/inventory/movements${toQueryString(params)}`),

    /** Aggregated consumption stats (today / week / month + top ingredient). */
    stats: (
      client: MyPosApiClient,
      params?: { reason?: StockMovementReason | string; ingredient_id?: string },
    ) =>
      client.get<{
        data: {
          reason: string;
          today: { quantity: number; cost: number; movements: number };
          week: { quantity: number; cost: number; movements: number };
          month: { quantity: number; cost: number; movements: number };
          top_ingredient:
            | null
            | { id: string; name: TranslatedString | string; unit: string; quantity: number };
        };
      }>(`/api/v1/inventory/movements/stats${toQueryString(params)}`),
  },
  adjustStock: (client: MyPosApiClient, ingredientId: string, input: StockAdjustmentInput) =>
    client.post<ResourceResponse<StockMovement>>(
      `/api/v1/inventory/ingredients/${ingredientId}/adjust`,
      input,
    ),
  lowStock: (client: MyPosApiClient) =>
    client.get<{ data: Ingredient[]; meta: { count: number } }>(
      '/api/v1/inventory/low-stock',
    ),
  valuation: (client: MyPosApiClient) =>
    client.get<ValuationResponse>('/api/v1/inventory/valuation'),
};
