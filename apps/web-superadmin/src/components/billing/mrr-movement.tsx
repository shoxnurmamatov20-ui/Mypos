'use client';

import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { MrrMovementPoint, MrrSummary } from '@/data/mock-billing';
import { cn } from '@/lib/cn';
import { formatUZS } from '@/lib/format';

type Props = {
  summary: MrrSummary;
  movement: MrrMovementPoint[];
};

/**
 * MRR movement waterfall + daily bar chart.
 *
 * Mobile-first layout: the four waterfall rows stack vertically below sm
 * (each row uses two lines: label/icon on top, value below right-aligned).
 * From sm: upward the rows flip to inline (label left, value right).
 * Above lg the whole card becomes two columns (rows + chart side by side).
 *
 * `overflow-hidden` + `min-w-0 w-full` on the chart wrapper guarantees
 * Recharts never widens the card past its container — that was the root
 * cause of the right-edge overflow that pushed UZS values off-screen.
 */
export function MrrMovement({ summary, movement }: Props) {
  const t = useTranslations('billing');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.06)';
  const tick = isDark ? '#94a3b8' : '#6b7280';

  // Recharts stacks accept negative values, so render churn negative
  // to land below the zero line.
  const chartData = movement.map((point) => ({
    date: point.date.slice(5),
    new: point.new_minor / 100,
    expansion: point.expansion_minor / 100,
    churn: -(point.churn_minor / 100),
  }));

  return (
    <Card className="p-3 sm:p-4 md:p-5 h-full overflow-hidden">
      <CardHeader className="mb-3 md:mb-4">
        <CardTitle hint={t('mrr_movement_subtitle')}>{t('mrr_movement_title')}</CardTitle>
      </CardHeader>

      <div className="flex flex-col gap-4 md:gap-5 lg:flex-row">
        <ul
          className="flex flex-col gap-2.5 sm:gap-3 lg:w-[38%] lg:min-w-[180px] min-w-0"
          role="list"
        >
          <WaterfallRow
            label={t('mrr_new')}
            value={formatUZS(summary.movement_30d.new_minor)}
            tone="positive"
          />
          <WaterfallRow
            label={t('mrr_expansion')}
            value={formatUZS(summary.movement_30d.expansion_minor)}
            tone="positive"
          />
          <WaterfallRow
            label={t('mrr_churn')}
            value={`− ${formatUZS(Math.abs(summary.movement_30d.churn_minor))}`}
            tone="negative"
          />
          <WaterfallRow
            label={t('mrr_net')}
            value={`${
              summary.movement_30d.net_minor >= 0 ? '+ ' : '− '
            }${formatUZS(Math.abs(summary.movement_30d.net_minor))}`}
            tone="net"
            bold
            divider
          />
        </ul>

        {/* min-w-0 + w-full lets Recharts SVG shrink to parent width on phones,
            preventing the horizontal overflow that previously pushed waterfall
            values past the card's right edge. */}
        <div className="h-44 sm:h-48 md:h-56 flex-1 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              stackOffset="sign"
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: tick, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                tick={{ fill: tick, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatUZS(v * 100).replace(" so'm", '')}
                width={56}
              />
              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,24,39,0.04)',
                }}
                contentStyle={{
                  background: isDark ? '#111827' : '#fff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 12,
                  fontSize: 12,
                  color: isDark ? '#e5e7eb' : '#111827',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: '8px 12px',
                }}
                labelStyle={{
                  color: isDark ? '#f9fafb' : '#111827',
                  fontWeight: 600,
                }}
                formatter={(value: number, name) => {
                  const formatted = formatUZS(Math.abs(value) * 100);
                  return [formatted, String(name)];
                }}
              />
              <Bar
                dataKey="new"
                stackId="m"
                fill={isDark ? '#10b981' : '#059669'}
                name={t('mrr_new')}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="expansion"
                stackId="m"
                fill={isDark ? '#34d399' : '#15803d'}
                name={t('mrr_expansion')}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="churn"
                stackId="m"
                fill={isDark ? '#ef4444' : '#dc2626'}
                name={t('mrr_churn')}
                radius={[0, 0, 2, 2]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

type WaterfallRowProps = {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'net';
  bold?: boolean;
  /** Renders a top border + padding to visually separate the net total. */
  divider?: boolean;
};

function WaterfallRow({ label, value, tone, bold = false, divider = false }: WaterfallRowProps) {
  const Icon = tone === 'negative' ? ArrowDownRight : tone === 'net' ? Equal : ArrowUpRight;
  const colorClass =
    tone === 'negative'
      ? 'text-red-700 dark:text-red-400'
      : tone === 'net'
        ? 'text-gray-900 dark:text-white'
        : 'text-emerald-700 dark:text-emerald-400';
  const iconBgClass =
    tone === 'negative'
      ? 'bg-red-50 dark:bg-red-500/15'
      : tone === 'net'
        ? 'bg-gray-100 dark:bg-gray-800'
        : 'bg-emerald-50 dark:bg-emerald-500/15';

  return (
    <li
      className={cn(
        // Stack label/value vertically below sm so long UZS numbers
        // (e.g. "9 360 000 so'm") never collide with the label or get
        // pushed past the card edge. Flip to inline horizontal from sm: up.
        'flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3',
        divider && 'border-t border-gray-200 dark:border-gray-800 pt-3 mt-1',
      )}
    >
      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-0">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md shrink-0',
            iconBgClass,
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-3.5 w-3.5', colorClass)} strokeWidth={2.2} />
        </span>
        <span className="font-medium truncate">{label}</span>
      </span>
      <span
        className={cn(
          // pl-8 (= h-6 + gap-2) on mobile aligns value under the label text
          // (past the icon box); flush-right + tabular-nums from sm: up.
          'tabular-nums pl-8 sm:pl-0 sm:text-right whitespace-nowrap',
          colorClass,
          bold ? 'font-extrabold text-[15px] sm:text-base' : 'font-semibold',
        )}
      >
        {value}
      </span>
    </li>
  );
}
