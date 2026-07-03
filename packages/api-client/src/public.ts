import type { MyPosApiClient } from './client';
import type { MenuCategory, MenuItem, ResourceResponse } from './menu';
import type { Order } from './orders';

/**
 * Public (unauthenticated) API types + calls — consumed by QR-menu PWA.
 *
 * The backend endpoints live under `/api/v1/public/*` and are NOT wrapped in
 * auth:sanctum middleware. They filter strictly by tenant slug.
 */

export type PublicTenant = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  default_locale: string;
  default_currency: string;
};

export type PublicMenuCategory = MenuCategory;
export type PublicMenuItem = MenuItem;

export type PublicMenuResponse = {
  data: {
    tenant: PublicTenant;
    categories: PublicMenuCategory[];
    items: PublicMenuItem[];
  };
};

export type PlaceQrOrderItemInput = {
  menu_item_id: string;
  quantity: number;
  notes?: string | null;
};

export type PlaceQrOrderInput = {
  tableId: string;
  items: PlaceQrOrderItemInput[];
  notes?: string | null;
};

export type SubmitOrderReviewInput = {
  order_id: string;
  rating: number;
  food_rating?: number;
  delivery_rating?: number;
  comment?: string;
  /** Anonymous flow — proves the caller was handed the order's tracking link. */
  tracking_token?: string;
};

export type SubmitOrderReviewResponse = {
  data: {
    id: string;
    order_id: string;
    rating: number;
    food_rating: number | null;
    delivery_rating: number | null;
    comment: string | null;
  };
};

export const publicApi = {
  menu: {
    get: (client: MyPosApiClient, slug: string) =>
      client.get<PublicMenuResponse>(`/api/v1/public/menu/${encodeURIComponent(slug)}`),
  },
  orders: {
    place: (client: MyPosApiClient, slug: string, input: PlaceQrOrderInput) =>
      client.post<ResourceResponse<Order>>(
        `/api/v1/public/menu/${encodeURIComponent(slug)}/orders`,
        {
          table_id: input.tableId,
          items: input.items,
          notes: input.notes ?? null,
        },
      ),
    submitReview: (client: MyPosApiClient, input: SubmitOrderReviewInput) =>
      client.post<SubmitOrderReviewResponse>('/api/v1/public/orders/review', input),
  },
};
