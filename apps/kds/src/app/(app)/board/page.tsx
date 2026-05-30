'use client';

import { type Order, type OrderStatus, ordersApi } from '@mypos/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock3,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OrderColumn } from '@/components/kitchen/order-column';
import { StatTile } from '@/components/kitchen/stat-tile';
import { apiClient, getStoredToken } from '@/lib/api';
import { cn } from '@/lib/cn';
import { subscribeToKitchen } from '@/lib/echo';
import { useKitchenSession } from '@/lib/session';
import { useKitchenSettings } from '@/lib/settings';
import { playChime, vibrateOnce } from '@/lib/sound';
import { minutesSince, urgencyLevel } from '@/lib/time';

type ColumnStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;
type NextStatus = Extract<OrderStatus, 'preparing' | 'ready' | 'served'>;

const NEXT_STATUS: Record<ColumnStatus, NextStatus> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const ORDERS_KEY = ['kds', 'orders', 'active'] as const;

export default function BoardPage() {
  const { tenantId } = useKitchenSession();
  const queryClient = useQueryClient();

  const soundEnabled = useKitchenSettings((s) => s.soundEnabled);
  const soundVolume = useKitchenSettings((s) => s.soundVolume);
  const vibrationEnabled = useKitchenSettings((s) => s.vibrationEnabled);
  const warningMin = useKitchenSettings((s) => s.warningThresholdMin);
  const urgentMin = useKitchenSettings((s) => s.urgentThresholdMin);
  const density = useKitchenSettings((s) => s.cardDensity);

  const [nowTick, setNowTick] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  // Re-render every 30s so elapsed-time labels stay fresh between polls.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Reverb subscribe — invalidate the orders query on new/changed events.
  // Falls back gracefully to polling if the WebSocket cannot connect.
  useEffect(() => {
    if (!tenantId) return;
    const token = getStoredToken();
    if (!token) return;

    const unsubscribe = subscribeToKitchen(tenantId, token, {
      onOrderPlaced: () => {
        setLiveConnected(true);
        void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      },
      onOrderStatusChanged: () => {
        setLiveConnected(true);
        void queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      },
    });
    setLiveConnected(true);

    return () => {
      unsubscribe();
      setLiveConnected(false);
    };
  }, [tenantId, queryClient]);

  const query = useQuery({
    queryKey: ORDERS_KEY,
    // When Reverb is connected, slow polling to 30s. Without it, 5s polling.
    refetchInterval: liveConnected ? 30_000 : 5_000,
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
    onMutate: ({ id }) => setUpdatingId(id),
    onSettled: async () => {
      setUpdatingId(null);
      await queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });

  const orders = useMemo(() => query.data ?? [], [query.data]);

  const grouped = useMemo(() => {
    const buckets: Record<ColumnStatus, Order[]> = {
      pending: [],
      preparing: [],
      ready: [],
    };
    for (const order of orders) {
      if (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready') {
        buckets[order.status].push(order);
      }
    }
    const byPlacedAt = (a: Order, b: Order) =>
      (Date.parse(a.placed_at ?? a.created_at) || 0) -
      (Date.parse(b.placed_at ?? b.created_at) || 0);
    buckets.pending.sort(byPlacedAt);
    buckets.preparing.sort(byPlacedAt);
    buckets.ready.sort(byPlacedAt);
    return buckets;
  }, [orders]);

  // New-ticket alert — chime + buzz when a pending order ID appears that
  // wasn't on the board last poll. The first load is primed silently.
  const seenPendingIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const current = new Set(grouped.pending.map((o) => o.id));
    const previous = seenPendingIds.current;
    if (previous === null) {
      seenPendingIds.current = current;
      return;
    }
    let hasNew = false;
    for (const id of current) {
      if (!previous.has(id)) {
        hasNew = true;
        break;
      }
    }
    if (hasNew) {
      if (soundEnabled) playChime(soundVolume);
      if (vibrationEnabled) vibrateOnce();
    }
    seenPendingIds.current = current;
  }, [grouped.pending, soundEnabled, soundVolume, vibrationEnabled]);

  const urgentCount = useMemo(() => {
    let count = 0;
    for (const order of orders) {
      const mins = minutesSince(order.placed_at ?? order.created_at);
      if (urgencyLevel(mins, warningMin, urgentMin) === 'urgent') count += 1;
    }
    return count;
  }, [orders, warningMin, urgentMin]);

  function handleAdvance(order: Order) {
    if (order.status !== 'pending' && order.status !== 'preparing' && order.status !== 'ready') {
      return;
    }
    mutation.mutate({ id: order.id, status: NEXT_STATUS[order.status] });
  }

  const activeTotal = grouped.pending.length + grouped.preparing.length + grouped.ready.length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16221f] dark:text-white">Buyurtmalar</h1>
          <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
            {activeTotal > 0
              ? `${activeTotal} ta faol buyurtma oshxonada`
              : 'Hozircha faol buyurtma yo‘q'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge connected={liveConnected} />
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-2.5 py-1.5 text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white hover:border-[#0f766e] dark:hover:border-[#14b8a6] transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', query.isFetching && 'animate-spin')}
              strokeWidth={2.2}
            />
            Yangilash
          </button>
        </div>
      </div>

      {query.isError ? (
        <div className="rounded-lg border border-[#b42318]/40 bg-[rgba(180,35,24,0.08)] px-4 py-2.5 text-[13px] text-[#b42318] dark:text-[#f87171]">
          Buyurtmalarni yuklashda xatolik. Qayta urinib ko‘ramiz…
        </div>
      ) : null}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Kutilmoqda"
          value={String(grouped.pending.length)}
          sub="Tayyorlash navbatida"
          icon={Clock3}
          accent="teal"
          fillPct={activeTotal ? (grouped.pending.length / activeTotal) * 100 : 0}
        />
        <StatTile
          label="Tayyorlanmoqda"
          value={String(grouped.preparing.length)}
          sub="Hozir pishirilmoqda"
          icon={ChefHat}
          accent="amber"
          fillPct={activeTotal ? (grouped.preparing.length / activeTotal) * 100 : 0}
        />
        <StatTile
          label="Tayyor"
          value={String(grouped.ready.length)}
          sub="Berishga tayyor"
          icon={CheckCircle2}
          accent="green"
          fillPct={activeTotal ? (grouped.ready.length / activeTotal) * 100 : 0}
        />
        <StatTile
          label="Kechikkan"
          value={String(urgentCount)}
          sub={`${urgentMin} daqiqadan oshgan`}
          icon={AlertTriangle}
          accent="red"
          fillPct={activeTotal ? (urgentCount / activeTotal) * 100 : 0}
        />
      </div>

      {/* Board — three columns, each scrolls independently */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        <OrderColumn
          title="Kutilmoqda"
          status="pending"
          orders={grouped.pending}
          nowTick={nowTick}
          updatingId={updatingId}
          onAdvance={handleAdvance}
          warningMin={warningMin}
          urgentMin={urgentMin}
          density={density}
        />
        <OrderColumn
          title="Tayyorlanmoqda"
          status="preparing"
          orders={grouped.preparing}
          nowTick={nowTick}
          updatingId={updatingId}
          onAdvance={handleAdvance}
          warningMin={warningMin}
          urgentMin={urgentMin}
          density={density}
        />
        <OrderColumn
          title="Tayyor"
          status="ready"
          orders={grouped.ready}
          nowTick={nowTick}
          updatingId={updatingId}
          onAdvance={handleAdvance}
          warningMin={warningMin}
          urgentMin={urgentMin}
          density={density}
        />
      </div>
    </div>
  );
}

/** Reverb connection pill — green when live, gray when polling-only. */
function LiveBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        connected
          ? 'bg-[rgba(24,121,78,0.12)] text-[#18794e] dark:bg-[rgba(34,197,94,0.16)] dark:text-[#4ade80]'
          : 'bg-[#eef4f3] text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]',
      )}
    >
      {connected ? (
        <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
      ) : (
        <WifiOff className="h-3.5 w-3.5" strokeWidth={2.5} />
      )}
      {connected ? 'Jonli' : 'Oflayn rejim'}
    </span>
  );
}
