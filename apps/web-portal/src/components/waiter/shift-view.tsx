'use client';

import { Button, cn, PageHeader } from '@mypos/ui';
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
import { useMemo, useState } from 'react';
import { formatSomShort, getWaiterData } from '@/lib/waiter-data';
import { useWaiterSession } from '@/lib/waiter-session';

/** Smenam — the waiter's shift: clock in/out, today's totals, activity. */
export function ShiftView() {
  const t = useTranslations('waiter');
  const { shift } = useMemo(() => getWaiterData(), []);
  const session = useWaiterSession();
  const [onShift, setOnShift] = useState(true);

  const stats: { id: string; icon: Icon; value: string }[] = [
    { id: 'tables', icon: GridFour, value: String(shift.tablesServed) },
    { id: 'orders', icon: Receipt, value: String(shift.ordersCount) },
    { id: 'sales', icon: Coins, value: formatSomShort(shift.salesTotal) },
    { id: 'tips', icon: CheckCircle, value: formatSomShort(shift.tipsTotal) },
    { id: 'active', icon: Storefront, value: String(shift.activeTables) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('shift.title')}
        description={t('shift.subtitle', { name: session?.name ?? '' })}
        actions={
          <Button
            variant={onShift ? 'danger' : 'primary'}
            onClick={() => setOnShift((value) => !value)}
          >
            {onShift ? t('shift.clockOut') : t('shift.clockIn')}
          </Button>
        }
      />

      {/* Shift status banner */}
      <div className="flex items-center gap-3 rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4">
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl',
            onShift
              ? 'bg-[rgba(24,121,78,0.10)] text-[#18794e]'
              : 'bg-[rgba(22,34,31,0.06)] text-[#9aa6a3]',
          )}
        >
          <ClockCounterClockwise className="h-5 w-5" weight="fill" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-[#16221f]">
            {onShift ? t('shift.onShift') : t('shift.offShift')}
          </p>
          <p className="text-[12px] text-[#62716d]">
            {t('shift.started', { time: shift.startedAt })}
          </p>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ id, icon: StatIcon, value }) => (
          <div key={id} className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef4f3] text-[#0f766e]">
              <StatIcon className="h-[18px] w-[18px]" weight="fill" />
            </span>
            <p className="mt-3 text-[20px] font-black leading-none text-[#16221f] tabular-nums">
              {value}
            </p>
            <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-[#62716d]">
              {t(`shift.stats.${id}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-4">
        <p className="mb-3 text-[13px] font-bold text-[#16221f]">{t('shift.activity')}</p>
        <div className="space-y-3">
          {shift.activity.map((entry, index) => (
            <div key={`${entry.at}-${index}`} className="flex gap-3">
              <span className="mt-0.5 text-[12px] font-semibold tabular-nums text-[#9aa6a3]">
                {entry.at}
              </span>
              <span className="relative flex-1 border-l border-[rgba(22,34,31,0.10)] pl-3 text-[13px] text-[#16221f]">
                <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#0f766e]" />
                {entry.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
