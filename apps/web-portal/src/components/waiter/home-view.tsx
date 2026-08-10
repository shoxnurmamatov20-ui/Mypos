'use client';

import { CaretRight } from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useWaiterTables } from '@/lib/use-waiter-data';
import { formatNum, type WaiterTable } from '@/lib/waiter-data';
import { DemoBadge, Skeleton } from './waiter-bits';

/**
 * Bosh sahifa (home) — the waiter's own open bills, one card per occupied
 * table with its running total and item count. Tapping a card jumps straight
 * into that table's checks (`/new-order?table=…`). Mirrors screenshot 9.png.
 */
export function HomeView() {
  const t = useTranslations('waiter');
  const { tables, live, isLoading } = useWaiterTables();

  const bills = useMemo(
    () =>
      tables
        .filter((table) => table.mine && (table.status === 'seated' || table.status === 'bill'))
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),
    [tables],
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div className="relative flex items-center justify-center">
        <h1 className="text-center text-body-strong text-ink">{t('home.title')}</h1>
        <div className="absolute right-0">
          <DemoBadge show={!live} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {['a', 'b', 'c'].map((key) => (
            <Skeleton key={key} className="h-[104px] rounded-lg" />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <EmptyBills title={t('home.empty')} hint={t('home.emptyHint')} />
      ) : (
        <div className="space-y-3">
          {bills.map((table) => (
            <BillCard key={table.id} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}

function BillCard({ table }: { table: WaiterTable }) {
  const t = useTranslations('waiter');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  return (
    <Link
      href={`/${locale}/new-order?table=${table.id}` as Route}
      className="flex items-center gap-3 rounded-lg border border-hairline-soft bg-canvas px-5 py-4 transition-all duration-200 hover:border-tenant/40 active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-body-strong text-ink">
          {t('home.tableNo', { number: table.number ?? table.label, zone: table.zone })}
        </p>
        <p className="text-body tabular-nums text-tenant">
          {t('home.total', { amount: formatNum(table.total ?? 0) })}
        </p>
        <p className="text-caption text-ink-muted-80">
          {t('home.ordersCount', { count: table.itemsCount ?? 0 })}
        </p>
      </div>
      <CaretRight className="h-5 w-5 flex-shrink-0 text-ink-muted-48" />
    </Link>
  );
}

function EmptyBills({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline bg-canvas/60 px-6 py-16 text-center">
      <p className="text-body-strong text-ink">{title}</p>
      <p className="mt-1.5 text-caption text-ink-muted-80">{hint}</p>
    </div>
  );
}
