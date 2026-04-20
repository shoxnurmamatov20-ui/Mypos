'use client';

import { statsApi, type OrderSummary } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DailyRevenueChart } from './daily-revenue-chart';
import { OrdersStatusPie } from './orders-status-pie';
import { StatsCards } from './stats-cards';
import { TopItemsChart } from './top-items-chart';

type Preset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const presetRange = (preset: Preset): { from: string; to: string } => {
  const now = new Date();
  const to = toIsoDate(now);
  const start = new Date(now);
  switch (preset) {
    case 'today':
      return { from: to, to };
    case 'week':
      start.setDate(start.getDate() - 6);
      return { from: toIsoDate(start), to };
    case 'month':
      start.setDate(start.getDate() - 29);
      return { from: toIsoDate(start), to };
    case 'quarter':
      start.setDate(start.getDate() - 89);
      return { from: toIsoDate(start), to };
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
      return { from: toIsoDate(start), to };
    default:
      return { from: to, to };
  }
};

export function ReportsManager() {
  const t = useTranslations('reports');
  const defaultRange = useMemo(() => presetRange('month'), []);
  const [from, setFrom] = useState<string>(defaultRange.from);
  const [to, setTo] = useState<string>(defaultRange.to);
  const [preset, setPreset] = useState<Preset>('month');

  const summaryQuery = useQuery({
    queryKey: ['stats', 'summary', from, to],
    queryFn: () => statsApi.summary(apiClient, { from, to }),
  });

  const applyPreset = (p: Preset): void => {
    setPreset(p);
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
  };

  const onFromChange = (v: string): void => {
    setFrom(v);
    setPreset('custom');
  };
  const onToChange = (v: string): void => {
    setTo(v);
    setPreset('custom');
  };

  const summary: OrderSummary | null = summaryQuery.data?.data ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DateRangeToolbar
        from={from}
        to={to}
        preset={preset}
        onFromChange={onFromChange}
        onToChange={onToChange}
        onPreset={applyPreset}
      />

      {summaryQuery.isLoading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          {t('loading')}
        </div>
      )}

      {summaryQuery.isError && (
        <div className="rounded-xl border border-danger bg-danger/10 p-4 text-sm text-danger">
          {t('load_failed')}
        </div>
      )}

      {summary && !summaryQuery.isLoading && (
        <>
          <StatsCards summary={summary} />

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DailyRevenueChart points={summary.daily_revenue} />
            </div>
            <OrdersStatusPie data={summary.orders_by_status} />
          </section>

          <section>
            <TopItemsChart items={summary.top_items} />
          </section>
        </>
      )}
    </div>
  );
}

function DateRangeToolbar({
  from,
  to,
  preset,
  onFromChange,
  onToChange,
  onPreset,
}: {
  from: string;
  to: string;
  preset: Preset;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onPreset: (p: Preset) => void;
}) {
  const t = useTranslations('reports');
  const presets: Array<Exclude<Preset, 'custom'>> = [
    'today',
    'week',
    'month',
    'quarter',
    'year',
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t('date_range.from')}
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-neutral-600">
          {t('date_range.to')}
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPreset(p)}
            className={
              'rounded-lg px-3 py-2 text-xs font-medium transition ' +
              (preset === p
                ? 'bg-brand-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
            }
          >
            {t(`date_range.presets.${p}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
