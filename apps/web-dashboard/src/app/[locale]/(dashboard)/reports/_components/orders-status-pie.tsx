'use client';

import type { OrdersByStatus } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS: Record<keyof OrdersByStatus, string> = {
  pending: '#b7791f',
  preparing: '#2563eb',
  ready: '#0f766e',
  served: '#6366f1',
  completed: '#18794e',
  cancelled: '#b42318',
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
    <div className="rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-5 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <h2 className="mb-4 text-sm font-semibold text-[#16221f] dark:text-white">
        {t('charts.status_distribution_title')}
      </h2>

      {rows.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-[rgba(22,34,31,0.12)] text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.10)] dark:text-[#94a3b8]">
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
                  background: '#fff',
                  border: '1px solid rgba(22,34,31,0.09)',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 4px 20px rgba(18,34,31,0.08)',
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
                <span className="text-[#16221f] dark:text-[#e2e8f0]">{r.name}</span>
                <span className="ml-auto font-semibold text-[#16221f] dark:text-white">
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
