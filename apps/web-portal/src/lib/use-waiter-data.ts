'use client';

/**
 * React Query hooks for the waiter panel.
 *
 * Every read tries the live API first and falls back to the demo fixtures
 * in `waiter-data.ts` when the request throws — same offline-tolerant
 * pattern as `web-cashier`'s `use-cashier-data`. Consumers get a `live`
 * flag so the views can label demo data honestly.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import {
  clockIn,
  clockOut,
  createStaffOrder,
  fetchWaiterMenu,
  fetchWaiterOrders,
  fetchWaiterShift,
  fetchWaiterTables,
  type LiveShiftActivity,
  markOrderServed,
  type NewOrderInput,
} from './waiter-api';
import {
  getWaiterData,
  type MenuCategory,
  type WaiterOrder,
  type WaiterTable,
} from './waiter-data';

const REFETCH_FAST = 30_000; // tables & orders — the floor changes constantly
const REFETCH_SLOW = 120_000; // menu & shift

export function useWaiterTables() {
  const locale = useLocale();
  const query = useQuery({
    queryKey: ['waiter', 'tables', locale],
    refetchInterval: REFETCH_FAST,
    queryFn: async (): Promise<{ rows: WaiterTable[]; live: boolean }> => {
      try {
        return { rows: await fetchWaiterTables(locale), live: true };
      } catch {
        return { rows: [...getWaiterData().tables], live: false };
      }
    },
  });
  return {
    tables: query.data?.rows ?? [],
    live: query.data?.live ?? true,
    isLoading: query.isPending,
    refetch: query.refetch,
  };
}

export function useWaiterOrders() {
  const locale = useLocale();
  const query = useQuery({
    queryKey: ['waiter', 'orders', locale],
    refetchInterval: REFETCH_FAST,
    queryFn: async (): Promise<{ rows: WaiterOrder[]; live: boolean }> => {
      try {
        return { rows: await fetchWaiterOrders(locale), live: true };
      } catch {
        return { rows: [...getWaiterData().orders], live: false };
      }
    },
  });
  return {
    orders: query.data?.rows ?? [],
    live: query.data?.live ?? true,
    isLoading: query.isPending,
  };
}

/** Optimistic one-tap status advance: ready → served. */
export function useMarkServed() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiId: string) => markOrderServed(apiId),
    onMutate: async (apiId) => {
      const key = ['waiter', 'orders', locale];
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(
        key,
        (old: { rows: WaiterOrder[]; live: boolean } | undefined) =>
          old && {
            ...old,
            rows: old.rows.map((order) =>
              order.apiId === apiId ? { ...order, status: 'served' as const } : order,
            ),
          },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter'] });
    },
  });
}

export function useWaiterMenu() {
  const locale = useLocale();
  const query = useQuery({
    queryKey: ['waiter', 'menu', locale],
    refetchInterval: REFETCH_SLOW,
    queryFn: async (): Promise<{ rows: MenuCategory[]; live: boolean }> => {
      try {
        return { rows: await fetchWaiterMenu(locale), live: true };
      } catch {
        return { rows: [...getWaiterData().menu], live: false };
      }
    },
  });
  return {
    menu: query.data?.rows ?? [],
    live: query.data?.live ?? true,
    isLoading: query.isPending,
  };
}

export interface ShiftView {
  onShift: boolean;
  startedAt: string;
  ordersCount: number;
  salesTotal: number;
  tipsTotal: number;
  tablesServed: number;
  activeTables: number;
  /** Live rows carry i18n event keys; fixture rows carry prebuilt text. */
  activity: Array<LiveShiftActivity | { at: string; text: string }>;
}

export function useWaiterShift() {
  const query = useQuery({
    queryKey: ['waiter', 'shift'],
    refetchInterval: REFETCH_SLOW,
    queryFn: async (): Promise<{ shift: ShiftView; live: boolean }> => {
      try {
        return { shift: await fetchWaiterShift(), live: true };
      } catch {
        const fixture = getWaiterData().shift;
        return {
          shift: {
            onShift: true,
            startedAt: fixture.startedAt,
            ordersCount: fixture.ordersCount,
            salesTotal: fixture.salesTotal,
            tipsTotal: fixture.tipsTotal,
            tablesServed: fixture.tablesServed,
            activeTables: fixture.activeTables,
            activity: [...fixture.activity],
          },
          live: false,
        };
      }
    },
  });
  return {
    shift: query.data?.shift ?? null,
    live: query.data?.live ?? true,
    isLoading: query.isPending,
  };
}

/** Submits a new dine-in order and refreshes every waiter query. */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewOrderInput) => createStaffOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter'] });
    },
  });
}

export function useClock() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['waiter', 'shift'] });
  const inMutation = useMutation({ mutationFn: clockIn, onSettled: invalidate });
  const outMutation = useMutation({ mutationFn: clockOut, onSettled: invalidate });
  return { clockIn: inMutation, clockOut: outMutation };
}
