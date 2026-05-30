'use client';

import { ordersApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RefreshCw, Timer, Utensils } from 'lucide-react';
import { useMemo } from 'react';
import { HistoryTable } from '@/components/kitchen/history-table';
import { StatTile } from '@/components/kitchen/stat-tile';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';

const HISTORY_KEY = ['kds', 'orders', 'served-today'] as const;

/** True when an ISO timestamp falls on the local calendar day. */
function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return false;
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function HistoryPage() {
  const query = useQuery({
    queryKey: HISTORY_KEY,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await ordersApi.list(apiClient, {
        status: 'served',
        per_page: 50,
      });
      return res.data;
    },
  });

  const todays = useMemo(() => {
    const rows = (query.data ?? []).filter((o) => isToday(o.served_at ?? o.updated_at));
    rows.sort(
      (a, b) =>
        (Date.parse(b.served_at ?? b.updated_at) || 0) -
        (Date.parse(a.served_at ?? a.updated_at) || 0),
    );
    return rows;
  }, [query.data]);

  const stats = useMemo(() => {
    let items = 0;
    let prepSum = 0;
    let prepCount = 0;
    for (const order of todays) {
      for (const item of order.items) items += item.quantity;
      const placed = order.placed_at ? Date.parse(order.placed_at) : NaN;
      const done = order.prepared_at
        ? Date.parse(order.prepared_at)
        : order.served_at
          ? Date.parse(order.served_at)
          : NaN;
      if (!Number.isNaN(placed) && !Number.isNaN(done) && done >= placed) {
        prepSum += (done - placed) / 60_000;
        prepCount += 1;
      }
    }
    return {
      count: todays.length,
      items,
      avgPrep: prepCount > 0 ? Math.round(prepSum / prepCount) : 0,
    };
  }, [todays]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16221f] dark:text-white">Tarix</h1>
          <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
            Bugun oshxonadan chiqqan buyurtmalar
          </p>
        </div>
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

      {query.isError ? (
        <div className="rounded-lg border border-[#b42318]/40 bg-[rgba(180,35,24,0.08)] px-4 py-2.5 text-[13px] text-[#b42318] dark:text-[#f87171]">
          Tarixni yuklashda xatolik. Qayta urinib ko‘ramiz…
        </div>
      ) : null}

      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Bugun berilgan"
          value={String(stats.count)}
          sub="Yopilgan buyurtmalar"
          icon={CheckCircle2}
          accent="green"
        />
        <StatTile
          label="Jami taomlar"
          value={String(stats.items)}
          sub="Tayyorlangan porsiyalar"
          icon={Utensils}
          accent="teal"
        />
        <StatTile
          label="O‘rtacha tayyorlash"
          value={`${stats.avgPrep} daq`}
          sub="Buyurtmadan tayyorgacha"
          icon={Timer}
          accent="amber"
        />
      </div>

      {/* Ledger */}
      {query.isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16">
          <Loader2
            className="h-7 w-7 animate-spin text-[#0f766e] dark:text-[#14b8a6]"
            aria-hidden="true"
          />
        </div>
      ) : (
        <HistoryTable orders={todays} />
      )}
    </div>
  );
}
