'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  MOCK_CATEGORIES,
  MOCK_ITEMS,
  MOCK_ORDERS,
  MOCK_PAYMENTS,
  MOCK_RECENT_SHIFTS,
  MOCK_SHIFT,
  MOCK_SHIFT_STATS,
} from '@/lib/mock-data';

/**
 * Every read here tries the Laravel API first and silently falls back to the
 * offline fixtures when the request *throws* (network down, 401, 5xx) — the
 * cashier panel stays usable in local dev before the backend is seeded.
 *
 * A successful-but-empty response is NOT replaced with fixtures: an empty
 * orders list is a real, honest state, not a failure.
 *
 * `live` tells the UI which source it got, so screens can show a subtle
 * "demo data" hint.
 */

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      try {
        const [categories, items] = await Promise.all([api.menuCategories(), api.menuItems()]);
        return { categories, items, live: true };
      } catch {
        return { categories: MOCK_CATEGORIES, items: MOCK_ITEMS, live: false };
      }
    },
  });
}

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status ?? 'all'],
    queryFn: async () => {
      try {
        return { rows: await api.orders(status), live: true };
      } catch {
        return { rows: MOCK_ORDERS, live: false };
      }
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      try {
        return { rows: await api.payments(), live: true };
      } catch {
        return { rows: MOCK_PAYMENTS, live: false };
      }
    },
  });
}

export function useShift() {
  return useQuery({
    queryKey: ['shift', 'current'],
    queryFn: async () => {
      try {
        return { shift: await api.currentShift(), live: true };
      } catch {
        return { shift: MOCK_SHIFT, live: false };
      }
    },
  });
}

export function useShiftStats() {
  return useQuery({
    queryKey: ['shift', 'stats'],
    queryFn: async () => {
      try {
        return { stats: await api.shiftStats(), live: true };
      } catch {
        return { stats: MOCK_SHIFT_STATS, live: false };
      }
    },
  });
}

export function useRecentShifts() {
  return useQuery({
    queryKey: ['shift', 'recent'],
    queryFn: async () => {
      try {
        return { rows: await api.recentShifts(), live: true };
      } catch {
        return { rows: MOCK_RECENT_SHIFTS, live: false };
      }
    },
  });
}
