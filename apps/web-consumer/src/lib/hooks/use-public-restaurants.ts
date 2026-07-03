'use client';

/**
 * React Query hooks for the public marketplace.
 *
 * Server Components fetch the same endpoints with `publicConsumerApi.*`
 * (in `lib/public-api.ts`); these client hooks layer on top so
 * interactive views — filter chips, polling, optimistic UI — can subscribe
 * to the same cache key and avoid duplicate fetches.
 *
 * `enabled` guards keep the hooks safe to mount on pages where the
 * required argument may not exist yet (e.g. cart page before the cart
 * has hydrated).
 */

import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import {
  isPublicLocale,
  type PublicLocale,
  type PublicMenuResponse,
  type PublicOrderResponse,
  type PublicRestaurantResponse,
  type PublicRestaurantsListParams,
  type PublicRestaurantsListResponse,
  publicConsumerApi,
} from '../public-api';

// ------------ Query keys ------------

export const publicQueryKeys = {
  all: ['public'] as const,
  restaurantsList: (params: PublicRestaurantsListParams) =>
    [...publicQueryKeys.all, 'restaurants', 'list', params] as const,
  restaurant: (slug: string) => [...publicQueryKeys.all, 'restaurants', 'detail', slug] as const,
  menu: (slug: string) => [...publicQueryKeys.all, 'menu', slug] as const,
  orderTracking: (token: string) => [...publicQueryKeys.all, 'orders', 'track', token] as const,
};

// ------------ Hooks ------------

function useResolvedLocale(): PublicLocale {
  const raw = useLocale();
  return isPublicLocale(raw) ? raw : 'uz';
}

/** List restaurants. Filter / sort happens server-side. */
export function usePublicRestaurants(
  params: PublicRestaurantsListParams = {},
  options?: Omit<UseQueryOptions<PublicRestaurantsListResponse>, 'queryKey' | 'queryFn'>,
) {
  const locale = useResolvedLocale();
  return useQuery<PublicRestaurantsListResponse>({
    queryKey: publicQueryKeys.restaurantsList(params),
    queryFn: () => publicConsumerApi.restaurants.list(params, { locale }),
    staleTime: 30_000,
    ...options,
  });
}

/** Single restaurant by slug — usually hydrated by the server. */
export function usePublicRestaurant(
  slug: string | null | undefined,
  options?: Omit<UseQueryOptions<PublicRestaurantResponse>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const locale = useResolvedLocale();
  return useQuery<PublicRestaurantResponse>({
    queryKey: publicQueryKeys.restaurant(slug ?? ''),
    queryFn: () => publicConsumerApi.restaurants.bySlug(slug!, { locale }),
    enabled: Boolean(slug),
    staleTime: 60_000,
    ...options,
  });
}

/** Public menu for a restaurant. */
export function usePublicMenu(
  slug: string | null | undefined,
  options?: Omit<UseQueryOptions<PublicMenuResponse>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const locale = useResolvedLocale();
  return useQuery<PublicMenuResponse>({
    queryKey: publicQueryKeys.menu(slug ?? ''),
    queryFn: () => publicConsumerApi.menu.bySlug(slug!, { locale }),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/**
 * Guest order tracking. Polls every 30s by default — once Reverb is
 * enabled (Agent B3) callers can switch to a websocket subscription
 * and pass `refetchInterval: false` here.
 */
export function usePublicOrderTracking(
  token: string | null | undefined,
  options?: Omit<UseQueryOptions<PublicOrderResponse>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const locale = useResolvedLocale();
  return useQuery<PublicOrderResponse>({
    queryKey: publicQueryKeys.orderTracking(token ?? ''),
    queryFn: () => publicConsumerApi.orders.track(token!, { locale }),
    enabled: Boolean(token),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    ...options,
  });
}
