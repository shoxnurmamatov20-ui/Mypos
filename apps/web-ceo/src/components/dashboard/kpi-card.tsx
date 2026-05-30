import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';

export type KpiCardProps = {
  icon: LucideIcon;
  /** Tailwind class for the icon stroke colour, e.g. `text-emerald-600`. */
  iconColor: string;
  /** Tailwind class for the icon container background, e.g. `bg-emerald-50`. */
  iconBg: string;
  label: string;
  value: string;
  /** Optional period-over-period delta. Sign drives the colour + arrow. */
  trend?: { value: number; positive?: boolean };
  hint?: string;
};

/**
 * Shared KPI tile (light/dark himoya theme). White surface, coloured
 * icon box top-left, optional trend chip top-right, UPPERCASE label,
 * big tabular number.
 */
export function KpiCard({ icon: Icon, iconColor, iconBg, label, value, trend, hint }: KpiCardProps) {
  const trendPositive =
    trend === undefined ? undefined : (trend.positive ?? trend.value >= 0);

  return (
    <article className="group flex flex-col rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors">
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
      <p className="mt-1.5 truncate text-[24px] font-black leading-none tabular-nums text-[#16221f] dark:text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-[11px] text-[#62716d] dark:text-[#94a3b8]">{hint}</p>
      ) : null}
    </article>
  );
}
