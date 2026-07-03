'use client';

import { cn, PageHeader } from '@mypos/ui';
import { Armchair, Users } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { formatSom, getWaiterData, type TableStatus, type WaiterTable } from '@/lib/waiter-data';
import { type PillTone, StatusPill } from './status-pill';

const STATUS_TONE: Record<TableStatus, PillTone> = {
  free: 'green',
  seated: 'teal',
  bill: 'amber',
  reserved: 'slate',
};

const DOT: Record<PillTone, string> = {
  green: 'bg-[#18794e]',
  teal: 'bg-[#0f766e]',
  amber: 'bg-[#b7791f]',
  slate: 'bg-[#9aa6a3]',
  blue: 'bg-[#2563eb]',
  red: 'bg-[#b42318]',
};

const STATUS_ORDER: readonly TableStatus[] = ['free', 'seated', 'bill', 'reserved'];

type Filter = 'all' | TableStatus;

/** Stollar — the waiter's table map: status summary, filter chips, grid. */
export function TablesView() {
  const t = useTranslations('waiter');
  const { tables } = useMemo(() => getWaiterData(), []);
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const base: Record<TableStatus, number> = { free: 0, seated: 0, bill: 0, reserved: 0 };
    for (const tbl of tables) base[tbl.status] += 1;
    return base;
  }, [tables]);

  const visible = useMemo(
    () => (filter === 'all' ? tables : tables.filter((tbl) => tbl.status === filter)),
    [tables, filter],
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t('tables.title')} description={t('tables.subtitle')} />

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', DOT[STATUS_TONE[status]])} />
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#62716d]">
                {t(`tables.status.${status}`)}
              </p>
            </div>
            <p className="mt-2 text-[26px] font-black leading-none text-[#16221f] tabular-nums">
              {counts[status]}
            </p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...STATUS_ORDER] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
              filter === value
                ? 'bg-[#0f766e] text-white'
                : 'border border-[rgba(22,34,31,0.10)] bg-white text-[#62716d] hover:text-[#16221f]',
            )}
          >
            {value === 'all' ? t('tables.filterAll') : t(`tables.status.${value}`)}
          </button>
        ))}
      </div>

      {/* Table grid */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.14)] bg-white/60 px-6 py-14 text-center text-[13px] text-[#62716d]">
          {t('tables.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((tbl) => (
            <TableCard key={tbl.id} table={tbl} />
          ))}
        </div>
      )}
    </div>
  );
}

function TableCard({ table }: { table: WaiterTable }) {
  const t = useTranslations('waiter');
  const occupied = table.status === 'seated' || table.status === 'bill';

  return (
    <div className="flex flex-col rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4 transition-colors hover:border-[rgba(15,118,110,0.35)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#16221f]">{table.label}</p>
          <p className="mt-0.5 text-[12px] text-[#62716d]">{table.zone}</p>
        </div>
        <StatusPill tone={STATUS_TONE[table.status]} label={t(`tables.status.${table.status}`)} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#62716d]">
        <Armchair className="h-4 w-4" />
        <span>{t('tables.seats', { count: table.seats })}</span>
      </div>

      {occupied ? (
        <div className="mt-3 space-y-1.5 border-t border-[rgba(22,34,31,0.07)] pt-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#62716d]">
            <Users className="h-4 w-4" />
            <span>{t('tables.guests', { count: table.guests ?? 0 })}</span>
            {table.occupiedFor ? (
              <span className="text-[#9aa6a3]">· {table.occupiedFor}</span>
            ) : null}
          </div>
          {table.orderId ? (
            <p className="text-[12px] text-[#62716d]">
              {t('tables.openOrder', { id: table.orderId })}
            </p>
          ) : null}
          {table.total ? (
            <p className="text-[14px] font-bold text-[#16221f] tabular-nums">
              {formatSom(table.total)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
