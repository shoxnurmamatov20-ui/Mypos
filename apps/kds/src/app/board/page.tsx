'use client';

import {
  ApiError,
  authApi,
  type Order,
  type OrderStatus,
  ordersApi,
} from '@mypos/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { KitchenHeader } from '@/components/KitchenHeader';
import { OrderColumn } from '@/components/OrderColumn';
import { apiClient, clearToken, getStoredToken } from '@/lib/api';

type ColumnStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;

type NextStatus = Extract<OrderStatus, 'preparing' | 'ready' | 'served'>;

const NEXT_STATUS: Record<ColumnStatus, NextStatus> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const ORDERS_KEY = ['kds', 'orders', 'active'] as const;

export default function BoardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Guard: require a token; fetch user for header greeting.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthReady(true);
    let cancelled = false;
    authApi
      .me(apiClient)
      .then((res) => {
        if (!cancelled) setUserName(res.data.name);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace('/login');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Re-render every 30s so elapsed-time labels stay fresh between polls.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const query = useQuery({
    queryKey: ORDERS_KEY,
    enabled: authReady,
    refetchInterval: 5_000,
    queryFn: async () => {
      const res = await ordersApi.list(apiClient, {
        active_only: true,
        per_page: 50,
      });
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (args: { id: string; status: NextStatus }) => {
      await ordersApi.updateStatus(apiClient, args.id, { status: args.status });
      return args.id;
    },
    onMutate: ({ id }) => {
      setUpdatingId(id);
    },
    onSettled: async () => {
      setUpdatingId(null);
      await queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });

  const grouped = useMemo(() => {
    const buckets: Record<ColumnStatus, Order[]> = {
      pending: [],
      preparing: [],
      ready: [],
    };
    for (const order of query.data ?? []) {
      if (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready') {
        buckets[order.status].push(order);
      }
    }
    const byPlacedAt = (a: Order, b: Order) => {
      const ta = Date.parse(a.placed_at ?? a.created_at) || 0;
      const tb = Date.parse(b.placed_at ?? b.created_at) || 0;
      return ta - tb;
    };
    buckets.pending.sort(byPlacedAt);
    buckets.preparing.sort(byPlacedAt);
    buckets.ready.sort(byPlacedAt);
    return buckets;
  }, [query.data]);

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  function handleAdvance(order: Order) {
    if (
      order.status !== 'pending' &&
      order.status !== 'preparing' &&
      order.status !== 'ready'
    ) {
      return;
    }
    mutation.mutate({ id: order.id, status: NEXT_STATUS[order.status] });
  }

  if (!authReady) {
    return (
      <main className="flex h-screen items-center justify-center bg-neutral-900">
        <p className="text-2xl text-neutral-400">Yuklanmoqda…</p>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-neutral-900">
      <KitchenHeader
        userName={userName}
        isRefreshing={query.isFetching}
        onLogout={handleLogout}
      />

      {query.isError && (
        <div className="border-b border-danger/40 bg-danger/10 px-8 py-3 text-center text-base text-danger">
          Buyurtmalarni yuklashda xatolik. Qayta urinib ko&lsquo;ramiz…
        </div>
      )}

      <div className="min-h-0 flex-1 grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
        <OrderColumn
          title="Kutilmoqda"
          status="pending"
          orders={grouped.pending}
          nowTick={nowTick}
          updatingId={updatingId}
          onAdvance={handleAdvance}
        />
        <OrderColumn
          title="Tayyorlanmoqda"
          status="preparing"
          orders={grouped.preparing}
          nowTick={nowTick}
          updatingId={updatingId}
          onAdvance={handleAdvance}
        />
        <OrderColumn
          title="Tayyor"
          status="ready"
          orders={grouped.ready}
          nowTick={nowTick}
          updatingId={updatingId}
          onAdvance={handleAdvance}
        />
      </div>
    </main>
  );
}
