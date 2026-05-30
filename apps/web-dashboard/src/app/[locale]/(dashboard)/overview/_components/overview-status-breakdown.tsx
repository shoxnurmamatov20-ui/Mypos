'use client';

import type { OrdersByStatus } from '@mypos/api-client';
import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

/** himoya-palette status colours, shared with the stat grid. */
const STATUS_COLORS: Record<keyof OrdersByStatus, string> = {
  pending: '#b7791f',
  preparing: '#2563eb',
  ready: '#0f766e',
  served: '#6366f1',
  completed: '#18794e',
  cancelled: '#b42318',
};

const STATUS_ORDER: readonly (keyof OrdersByStatus)[] = [
  'pending',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled',
];

/**
 * Orders-by-status donut with a legend list — borderless himoya card.
 * Sits beside the revenue trend on the overview dashboard.
 */
export function OverviewStatusBreakdown({ data }: { data: OrdersByStatus }) {
  const t = useTranslations('overview');

  const rows = STATUS_ORDER.map((key) => ({
    key,
    name: t(`status.${key}`),
    value: data[key] ?? 0,
    color: STATUS_COLORS[key],
  })).filter((r) => r.value > 0);

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <section className="flex flex-col rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-5 transition-colors dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-[#16221f] dark:text-white">
          {t('sections.orders_by_status')}
        </h3>
        <span className="tabular-nums text-xs font-bold text-[#16221f] dark:text-white">
          {total}
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center text-[#62716d] dark:text-[#94a3b8]">
          <Inbox className="mb-2 h-8 w-8 opacity-60" strokeWidth={1.5} />
          <p className="text-[13px]">{t('empty')}</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {rows.map((r) => (
                    <Cell key={r.key} fill={r.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid rgba(22,34,31,0.09)',
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: '0 4px 20px rgba(18,34,31,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-black leading-none tabular-nums text-[#16221f] dark:text-white">
                {total}
              </span>
              <span className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                {t('labels.orders')}
              </span>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2 text-[13px]">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-[#62716d] dark:text-[#94a3b8]">{r.name}</span>
                <span className="ml-auto font-semibold tabular-nums text-[#16221f] dark:text-white">
                  {r.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
