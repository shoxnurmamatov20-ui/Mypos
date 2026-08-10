'use client';

import { cn, PageHeader } from '@mypos/ui';
import {
  CheckCircle,
  ClockCounterClockwise,
  Coins,
  GridFour,
  type Icon,
  Receipt,
  Storefront,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useClock, useWaiterShift } from '@/lib/use-waiter-data';
import { formatSomShort } from '@/lib/waiter-data';
import { useWaiterSession } from '@/lib/waiter-session';
import { DemoBadge, Skeleton } from './waiter-bits';

/** Smenam — the waiter's shift: clock in/out, today's totals, activity. */
export function ShiftView() {
  const t = useTranslations('waiter');
  const { shift, live, isLoading } = useWaiterShift();
  const { clockIn, clockOut } = useClock();
  const session = useWaiterSession();

  const onShift = shift?.onShift ?? false;
  const busy = clockIn.isPending || clockOut.isPending;

  const stats: { id: string; icon: Icon; value: string }[] = shift
    ? [
        { id: 'tables', icon: GridFour, value: String(shift.tablesServed) },
        { id: 'orders', icon: Receipt, value: String(shift.ordersCount) },
        { id: 'sales', icon: Coins, value: formatSomShort(shift.salesTotal) },
        { id: 'tips', icon: CheckCircle, value: formatSomShort(shift.tipsTotal) },
        { id: 'active', icon: Storefront, value: String(shift.activeTables) },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title={t('shift.title')}
        description={t('shift.subtitle', { name: session?.name ?? '' })}
        actions={
          <div className="flex items-center gap-2">
            <DemoBadge show={!live} />
            <button
              type="button"
              disabled={busy || isLoading}
              onClick={() => (onShift ? clockOut.mutate() : clockIn.mutate())}
              className={cn(
                'rounded-pill px-4 py-2 text-caption-strong transition-transform active:scale-95 disabled:opacity-60',
                onShift ? 'bg-error-soft text-error-text' : 'bg-tenant text-tenant-on-primary',
              )}
            >
              {onShift ? t('shift.clockOut') : t('shift.clockIn')}
            </button>
          </div>
        }
      />

      {/* Shift status banner */}
      <div className="flex items-center gap-3 rounded-lg border border-hairline-soft bg-canvas p-4">
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-lg',
            onShift ? 'bg-success-soft text-success-text' : 'bg-ink-muted-48/10 text-ink-muted-48',
          )}
        >
          <ClockCounterClockwise className="h-5 w-5" weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-36" />
            </>
          ) : (
            <>
              <p className="text-caption-strong text-ink">
                {onShift ? t('shift.onShift') : t('shift.offShift')}
              </p>
              <p className="text-fine-print text-ink-muted-80">
                {t('shift.started', { time: shift?.startedAt ?? '—' })}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {isLoading
          ? ['a', 'b', 'c', 'd', 'e'].map((key) => <Skeleton key={key} className="h-[110px]" />)
          : stats.map(({ id, icon: StatIcon, value }) => (
              <div key={id} className="rounded-lg border border-hairline-soft bg-canvas p-4">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-tenant-tint text-tenant">
                  <StatIcon className="h-[18px] w-[18px]" weight="fill" />
                </span>
                <p className="mt-3 font-display text-tagline leading-none text-ink tabular-nums">
                  {value}
                </p>
                <p className="mt-1.5 text-fine-print font-semibold uppercase tracking-wide text-ink-muted-80">
                  {t(`shift.stats.${id}`)}
                </p>
              </div>
            ))}
      </div>

      {/* Activity feed */}
      {shift && shift.activity.length > 0 ? (
        <div className="rounded-lg border border-hairline-soft bg-canvas p-4">
          <p className="mb-3 text-caption-strong text-ink">{t('shift.activity')}</p>
          <div className="space-y-3">
            {shift.activity.map((entry) => {
              const text =
                'text' in entry
                  ? entry.text
                  : t(`shift.events.${entry.event}`, { id: entry.orderNo });
              return (
                <div key={`${entry.at}-${text}`} className="flex gap-3">
                  <span className="mt-0.5 text-fine-print font-semibold tabular-nums text-ink-muted-48">
                    {entry.at}
                  </span>
                  <span className="relative flex-1 border-l border-hairline-soft pl-3 text-caption text-ink">
                    <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-tenant" />
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
