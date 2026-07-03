'use client';

import { format } from 'date-fns';
import type { TooltipProps } from 'recharts';
import { formatNumber, formatUZS } from '@/lib/format';

type Variant = 'revenue' | 'orders';

type DashboardTooltipProps = TooltipProps<number, string> & {
  variant: Variant;
  label?: string;
};

/**
 * Custom tooltip used by both the revenue area chart and the orders bar
 * chart. Single component — variant decides the formatter + label so the
 * surface, border and typography stay perfectly consistent. Themed so it
 * reads in either light or dark mode without a runtime theme lookup.
 */
export function DashboardTooltip({ active, payload, variant }: DashboardTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0];
  const value = typeof point?.value === 'number' ? point.value : 0;
  const rawDate = point?.payload?.date as string | undefined;

  const formattedDate = rawDate
    ? format(new Date(rawDate), 'd MMM yyyy')
    : ((point?.payload?.label as string | undefined) ?? '');

  const formattedValue = variant === 'revenue' ? formatUZS(value) : formatNumber(value);
  const valueLabel = variant === 'revenue' ? 'tooltip_revenue' : 'tooltip_orders';

  return (
    <div className="rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white/95 dark:bg-[#0b1120]/95 px-3 py-2 text-xs shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur">
      <p className="font-semibold text-[#62716d] dark:text-[#94a3b8]">{formattedDate}</p>
      <p className="mt-1 flex items-center gap-2 text-[#16221f] dark:text-white">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: variant === 'revenue' ? '#0f766e' : '#2563eb' }}
          aria-hidden="true"
        />
        <span className="text-[#62716d] dark:text-[#94a3b8]">{TOOLTIP_LABELS[valueLabel]}:</span>
        <span className="font-bold tabular-nums">{formattedValue}</span>
      </p>
    </div>
  );
}

/**
 * Inline labels — using a separate `useTranslations` call inside Recharts
 * tooltip would force the component to be a hook-bearing function, which
 * Recharts re-renders aggressively. Static fallbacks keep the tooltip
 * deterministic.
 */
const TOOLTIP_LABELS: Record<string, string> = {
  tooltip_revenue: 'Daromad',
  tooltip_orders: 'Buyurtma',
};
