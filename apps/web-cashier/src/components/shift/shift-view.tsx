'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Coffee, LogIn, LogOut, Play, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRecentShifts, useShift, useShiftStats } from '@/hooks/use-cashier-data';
import type { AppLocale } from '@/i18n/routing';
import { api, type ShiftInfo, type ShiftStatus } from '@/lib/api';
import { formatDate, formatDuration, formatTime, minutesSince } from '@/lib/format';

const STATUS_VARIANT: Record<ShiftStatus, BadgeVariant> = {
  scheduled: 'info',
  open: 'success',
  in_progress: 'success',
  closed: 'neutral',
  missed: 'danger',
};

type ShiftQuery = { shift: ShiftInfo | null; live: boolean };

/** Shift management — clock in/out, breaks, today's stats, recent history. */
export function ShiftView() {
  const t = useTranslations('shift');
  const locale = useLocale() as AppLocale;
  const queryClient = useQueryClient();
  const { data: shiftData } = useShift();
  const { data: statsData } = useShiftStats();
  const { data: recentData } = useRecentShifts();

  const shift = shiftData?.shift ?? null;
  const stats = statsData?.stats;
  const isOpen = shift?.status === 'open' || shift?.status === 'in_progress';

  const patchShift = (next: ShiftInfo | null) => {
    queryClient.setQueryData<ShiftQuery>(['shift', 'current'], (old) =>
      old ? { ...old, shift: next } : { shift: next, live: false },
    );
  };

  const mutation = useMutation({
    mutationFn: (action: 'in' | 'out' | 'break_start' | 'break_end') => {
      if (action === 'in') return api.clockIn();
      if (action === 'out') return api.clockOut();
      if (action === 'break_start') return api.startBreak();
      return api.endBreak();
    },
    onMutate: (action) => {
      const now = new Date().toISOString();
      if (action === 'in') {
        patchShift({
          id: 'local',
          status: 'open',
          started_at: now,
          ended_at: null,
          worked_minutes: 0,
          break_minutes: 0,
          on_break: false,
          break_started_at: null,
        });
      } else if (shift) {
        if (action === 'out') {
          patchShift({ ...shift, status: 'closed', ended_at: now, on_break: false });
        } else if (action === 'break_start') {
          patchShift({ ...shift, on_break: true, break_started_at: now });
        } else {
          const extra = minutesSince(shift.break_started_at);
          patchShift({
            ...shift,
            on_break: false,
            break_started_at: null,
            break_minutes: shift.break_minutes + extra,
          });
        }
      }
    },
    // Backend unreachable → keep the optimistic state (offline fixtures).
  });

  const worked = shift
    ? isOpen
      ? Math.max(0, minutesSince(shift.started_at) - shift.break_minutes)
      : shift.worked_minutes
    : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Current shift */}
      <section className="lg:col-span-2">
        <h1 className="text-xl font-bold text-[#16221f] dark:text-white">{t('title')}</h1>
        <p className="mb-4 mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
          {t('subtitle')}
        </p>

        <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-5 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#16221f] dark:text-white">
              {t('current_shift')}
            </h2>
            {shift ? (
              <Badge variant={shift.on_break ? 'warning' : STATUS_VARIANT[shift.status]}>
                {shift.on_break ? t('on_break') : t(`statuses.${shift.status}`)}
              </Badge>
            ) : null}
          </div>

          {isOpen ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Metric label={t('started_at')} value={formatTime(shift?.started_at ?? null)} />
                <Metric label={t('worked')} value={formatDuration(worked, locale)} />
                <Metric
                  label={t('break_total')}
                  value={formatDuration(shift?.break_minutes ?? 0, locale)}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate('out')}
                >
                  <LogOut className="h-4 w-4" />
                  {t('clock_out')}
                </Button>
                {shift?.on_break ? (
                  <Button
                    variant="secondary"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate('break_end')}
                  >
                    <Play className="h-4 w-4" />
                    {t('end_break')}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate('break_start')}
                  >
                    <Coffee className="h-4 w-4" />
                    {t('start_break')}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-sm font-semibold text-[#16221f] dark:text-white">
                {t('no_open_shift')}
              </p>
              <p className="text-xs text-[#62716d] dark:text-[#94a3b8]">
                {t('no_open_shift_hint')}
              </p>
              <Button
                className="mt-2"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate('in')}
              >
                <LogIn className="h-4 w-4" />
                {t('clock_in')}
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <h2 className="mb-3 mt-6 text-sm font-semibold text-[#16221f] dark:text-white">
          {t('stats_title')}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            icon={<Receipt className="h-4 w-4" />}
            label={t('orders_count')}
            value={String(stats?.orders_count ?? 0)}
          />
          <Metric
            icon={<Wallet className="h-4 w-4" />}
            label={t('revenue')}
            value={fmt(stats?.revenue)}
            highlight
          />
          <Metric
            icon={<TrendingUp className="h-4 w-4" />}
            label={t('avg_order')}
            value={fmt(stats?.avg_order)}
          />
          <Metric
            icon={<Coffee className="h-4 w-4" />}
            label={t('tips')}
            value={fmt(stats?.tips)}
          />
        </div>
      </section>

      {/* Recent shifts */}
      <section>
        <h2 className="mb-3 mt-[2.35rem] text-sm font-semibold text-[#16221f] lg:mt-[3.6rem] dark:text-white">
          {t('recent_shifts')}
        </h2>
        <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <ul className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
            {(recentData?.rows ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-[#16221f] dark:text-white">
                    {formatDate(row.date)}
                  </p>
                  <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                    {formatDuration(row.worked_minutes, locale)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[row.status]}>{t(`statuses.${row.status}`)}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function fmt(value: number | undefined): string {
  const n = value ?? 0;
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

function Metric({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[rgba(22,34,31,0.07)] bg-gray-50/60 p-3 dark:border-[rgba(255,255,255,0.05)] dark:bg-[#0b1120]/60">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#62716d] dark:text-[#94a3b8]">
        {icon ? <span className="text-[#0f766e] dark:text-[#5ed6c9]">{icon}</span> : null}
        {label}
      </div>
      <p
        className={
          highlight
            ? 'tnum mt-1 text-[15px] font-bold text-[#0f766e] dark:text-[#5ed6c9]'
            : 'tnum mt-1 text-[15px] font-bold text-[#16221f] dark:text-white'
        }
      >
        {value}
      </p>
    </div>
  );
}
