'use client';

import type { OrdersByStatus } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS: Record<keyof OrdersByStatus, string> = {
  pending: '#f59e0b',
  preparing: '#0ea5e9',
  ready: '#10b981',
  served: '#6366f1',
  completed: '#737373',
  cancelled: '#ef4444',
};

export function OrdersStatusPie({ data }: { data: OrdersByStatus }) {
  const t = useTranslations('reports');
  const statuses = Object.keys(data) as Array<keyof OrdersByStatus>;

  const rows = statuses
    .map((s) => ({
      key: s,
      name: t(`status.${s}`),
      value: data[s],
      color: STATUS_COLORS[s],
    }))
    .filter((r) => r.value > 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">
        {t('charts.status_distribution_title')}
      </h2>

      {rows.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-sm text-neutral-500">
          {t('empty')}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {rows.map((r) => (
                  <Cell key={r.key} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e5e5',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-neutral-700">{r.name}</span>
                <span className="ml-auto font-semibold text-neutral-900">
                  {r.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
