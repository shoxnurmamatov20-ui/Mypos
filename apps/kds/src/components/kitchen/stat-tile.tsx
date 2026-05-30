import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatAccent = 'teal' | 'amber' | 'green' | 'red';

const ACCENT: Record<StatAccent, { iconBg: string; iconColor: string; barColor: string }> = {
  teal: {
    iconBg: 'bg-[rgba(15,118,110,0.10)]',
    iconColor: 'text-[#0f766e]',
    barColor: 'bg-[#0f766e]',
  },
  amber: {
    iconBg: 'bg-[rgba(183,121,31,0.10)]',
    iconColor: 'text-[#b7791f]',
    barColor: 'bg-[#b7791f]',
  },
  green: {
    iconBg: 'bg-[rgba(24,121,78,0.10)]',
    iconColor: 'text-[#18794e]',
    barColor: 'bg-[#18794e]',
  },
  red: {
    iconBg: 'bg-[rgba(180,35,24,0.10)]',
    iconColor: 'text-[#b42318]',
    barColor: 'bg-[#b42318]',
  },
};

type StatTileProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: StatAccent;
  /** Bottom bar fill percent (0–100). Defaults to 0 (no fill). */
  fillPct?: number;
};

/**
 * Kitchen KPI tile — the web-superadmin `StatCard` shape: white surface,
 * UPPERCASE label, big tabular number, icon-in-coloured-box top-right,
 * and a 3px accent bottom bar filled to `fillPct`.
 */
export function StatTile({ label, value, sub, icon: Icon, accent, fillPct = 0 }: StatTileProps) {
  const a = ACCENT[accent];

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] mb-2">
            {label}
          </p>
          <p className="text-[28px] font-black leading-none text-[#16221f] dark:text-white tabular-nums mb-1.5">
            {value}
          </p>
          {sub ? <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">{sub}</p> : null}
        </div>

        <div
          className={cn(
            'grid h-[34px] w-[34px] place-items-center rounded-[10px] flex-shrink-0',
            a.iconBg,
          )}
        >
          <Icon className={cn('h-[17px] w-[17px]', a.iconColor)} strokeWidth={2} />
        </div>
      </div>

      <div className="mt-2.5 h-[3px] rounded-[2px] bg-[rgba(22,34,31,0.06)] dark:bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className={cn('h-full rounded-[2px] transition-[width] duration-500', a.barColor)}
          style={{ width: `${Math.max(0, Math.min(100, fillPct))}%` }}
        />
      </div>
    </div>
  );
}
