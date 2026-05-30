import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';

export type KpiCardProps = {
  icon: LucideIcon;
  /** Tailwind class for the icon stroke colour, e.g. `text-[#0f766e]`. */
  iconColor: string;
  /** Tailwind class for the icon container background. */
  iconBg: string;
  label: string;
  value: string;
  /** Optional period-over-period delta. Sign drives the colour + arrow. */
  trend?: { value: number; positive?: boolean };
  hint?: string;
};

/**
 * Shared KPI tile (himoya light/dark theme). White surface, coloured
 * icon box top-left, optional trend chip top-right, UPPERCASE label,
 * big tabular number. Used by both the billing strip and the admins
 * page stats — the dashboard has its own `StatCard` variant with a
 * bottom progress bar.
 */
export function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  trend,
  hint,
}: KpiCardProps) {
  const trendPositive =
    trend === undefined ? undefined : trend.positive ?? trend.value >= 0;

  // min-w-0 + overflow-hidden lets the card shrink below its
  // intrinsic content width when packed in a grid (e.g. grid-cols-2 on
  // a 430px viewport). Without these, a long UZS value like
  // `9 360 000 so'm` with tabular-nums + font-black pushes the cell
  // past its allocated 50% slot, expanding the grid row beyond viewport
  // and forcing the whole page into horizontal scroll. The `truncate`
  // on the inner <p> only activates once the parent gives it a bound.
  return (
    <article className="group flex flex-col rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors hover:border-[rgba(15,118,110,0.20)] dark:hover:border-[rgba(20,184,166,0.20)] min-w-0 overflow-hidden">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-[34px] w-[34px] items-center justify-center rounded-[10px]',
            iconBg,
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-[17px] w-[17px]', iconColor)} strokeWidth={2} />
        </div>
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-[7px] py-[2px] text-[11px] font-bold tabular-nums leading-[1.4]',
              trendPositive
                ? 'bg-[rgba(34,197,94,0.11)] text-[#18794e] dark:text-emerald-400'
                : 'bg-[rgba(239,68,68,0.11)] text-[#b42318] dark:text-red-400',
            )}
          >
            {trendPositive ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            )}
            {formatPercent(Math.abs(trend.value), { digits: 1 })}
          </span>
        ) : null}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[22px] sm:text-[24px] font-black leading-none tabular-nums text-[#16221f] dark:text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-[11px] text-[#62716d] dark:text-[#94a3b8] leading-snug">{hint}</p>
      ) : null}
    </article>
  );
}
