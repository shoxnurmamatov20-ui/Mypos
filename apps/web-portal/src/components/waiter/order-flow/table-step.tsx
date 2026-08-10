'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import type { WaiterTable } from '@/lib/waiter-data';
import { Skeleton } from '../waiter-bits';

/**
 * Table grid for one zone (screenshot 7.png). Free tiles show just the big
 * number; occupied tiles are tinted — green when the open bill is the current
 * waiter's own, amber when a colleague holds it — with the occupant's name,
 * open time and a masked total.
 */
export function TableStep({
  tables,
  isLoading,
  onPick,
}: {
  tables: WaiterTable[];
  isLoading: boolean;
  onPick: (tableId: string) => void;
}) {
  const t = useTranslations('waiter');

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
          <Skeleton key={key} className="h-[78px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-canvas/60 px-6 py-16 text-center text-body text-ink-muted-80">
        {t('table.empty')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {tables.map((table) => (
        <TableTile key={table.id} table={table} onPick={() => onPick(table.id)} />
      ))}
    </div>
  );
}

function TableTile({ table, onPick }: { table: WaiterTable; onPick: () => void }) {
  const occupied = table.status === 'seated' || table.status === 'bill';
  const number = table.number ?? table.label;

  if (!occupied) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="flex h-[78px] items-center justify-center rounded-lg border border-hairline-soft bg-parchment transition-all duration-200 hover:border-tenant active:scale-95"
      >
        <span className="font-display text-[26px] font-semibold leading-none text-ink tabular-nums">
          {number}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'relative flex h-[78px] flex-col justify-between overflow-hidden rounded-lg px-3 py-2.5 text-left transition-transform duration-200 active:scale-95',
        table.mine ? 'bg-success text-ink' : 'bg-warning text-ink',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="truncate text-fine-print font-semibold uppercase text-ink/85">
          {table.occupantName ?? ''}
        </span>
        <span className="font-display text-[22px] font-semibold leading-none text-ink tabular-nums">
          {number}
        </span>
      </div>
      <div className="flex items-end justify-between gap-1">
        <span className="text-fine-print tabular-nums text-ink/75">{table.openedAt ?? ''}</span>
        <span className="text-fine-print leading-none tracking-[0.15em] text-ink/45">••••••</span>
      </div>
    </button>
  );
}
