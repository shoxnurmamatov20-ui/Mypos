'use client';

import type { Table, TableStatus } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;
const TABLE_SIZE = 80;

const STATUS_FILL_CLASS: Record<TableStatus, string> = {
  available: 'bg-emerald-500 dark:bg-emerald-600 text-white',
  occupied: 'bg-rose-500 dark:bg-rose-600 text-white',
  reserved: 'bg-amber-500 dark:bg-amber-600 text-white',
  disabled: 'bg-[#62716d] dark:bg-[#475569] text-white',
};

const STATUS_BORDER_CLASS: Record<TableStatus, string> = {
  available: 'border-emerald-700 dark:border-emerald-400',
  occupied: 'border-rose-700 dark:border-rose-400',
  reserved: 'border-amber-700 dark:border-amber-400',
  disabled: 'border-[#16221f]/40 dark:border-white/30',
};

export function FloorPlan({ tables, isLoading }: { tables: Table[]; isLoading: boolean }) {
  const t = useTranslations('tables');

  const placedTables = tables.filter(
    (table) => table.position_x !== null && table.position_y !== null,
  );
  const unassignedTables = tables.filter(
    (table) => table.position_x === null || table.position_y === null,
  );

  if (isLoading) {
    return <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>;
  }

  if (tables.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
        {t('empty_tables')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-auto rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]">
        <div
          className="relative bg-[radial-gradient(circle,_rgba(0,0,0,0.08)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] [background-size:40px_40px]"
          style={{
            width: `${CANVAS_WIDTH / 2}px`,
            height: `${CANVAS_HEIGHT / 2}px`,
            minWidth: '100%',
          }}
        >
          {placedTables.map((table) => (
            <FloorPlanTable key={table.id} table={table} />
          ))}
        </div>
      </div>

      {unassignedTables.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#16221f] dark:text-[#e2e8f0]">
            {t('unassigned')}
          </h3>
          <div className="flex flex-wrap gap-3 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4">
            {unassignedTables.map((table) => (
              <UnassignedTable key={table.id} table={table} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-[#62716d] dark:text-[#94a3b8]">
        <Legend status="available" label={t('status.available')} />
        <Legend status="occupied" label={t('status.occupied')} />
        <Legend status="reserved" label={t('status.reserved')} />
        <Legend status="disabled" label={t('status.disabled')} />
      </div>
    </div>
  );
}

function FloorPlanTable({ table }: { table: Table }) {
  // tables placed have non-null x/y — narrow safely
  const x = table.position_x ?? 0;
  const y = table.position_y ?? 0;
  const left = x / 2;
  const top = y / 2;

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center border-2 text-xs font-semibold',
        STATUS_FILL_CLASS[table.status],
        STATUS_BORDER_CLASS[table.status],
        shapeClass(table.shape),
      )}
      style={{
        width: shapeSize(table.shape).width,
        height: shapeSize(table.shape).height,
        left: `${left}px`,
        top: `${top}px`,
      }}
      title={`${table.name} · ${table.capacity}`}
    >
      <span className="px-1 text-center leading-tight">{table.name}</span>
    </div>
  );
}

function UnassignedTable({ table }: { table: Table }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center border-2 text-xs font-semibold',
        STATUS_FILL_CLASS[table.status],
        STATUS_BORDER_CLASS[table.status],
        shapeClass(table.shape),
      )}
      style={{
        width: shapeSize(table.shape).width,
        height: shapeSize(table.shape).height,
      }}
      title={`${table.name} · ${table.capacity}`}
    >
      <span className="px-1 text-center leading-tight">{table.name}</span>
    </div>
  );
}

function Legend({ status, label }: { status: TableStatus; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded-full', STATUS_FILL_CLASS[status])} />
      <span>{label}</span>
    </div>
  );
}

function shapeClass(shape: Table['shape']): string {
  switch (shape) {
    case 'round':
      return 'rounded-full';
    case 'oval':
      return 'rounded-full';
    case 'square':
      return 'rounded-md';
    case 'rectangle':
      return 'rounded-md';
  }
}

function shapeSize(shape: Table['shape']): { width: number; height: number } {
  switch (shape) {
    case 'round':
    case 'square':
      return { width: TABLE_SIZE, height: TABLE_SIZE };
    case 'oval':
    case 'rectangle':
      return { width: TABLE_SIZE * 1.5, height: TABLE_SIZE * 0.75 };
  }
}
