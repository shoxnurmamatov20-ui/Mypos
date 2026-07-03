'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';

type Accent = 'teal' | 'violet' | 'green' | 'amber' | 'red' | 'blue' | 'indigo' | 'pink';

const ACCENT: Record<Accent, { iconBg: string; iconColor: string; barColor: string }> = {
  teal: {
    iconBg: 'bg-[rgba(15,118,110,0.10)]',
    iconColor: 'text-[#0f766e]',
    barColor: 'bg-[#0f766e]',
  },
  violet: {
    iconBg: 'bg-[rgba(124,58,237,0.10)]',
    iconColor: 'text-[#7c3aed]',
    barColor: 'bg-[#7c3aed]',
  },
  green: {
    iconBg: 'bg-[rgba(24,121,78,0.10)]',
    iconColor: 'text-[#18794e]',
    barColor: 'bg-[#18794e]',
  },
  amber: {
    iconBg: 'bg-[rgba(183,121,31,0.10)]',
    iconColor: 'text-[#b7791f]',
    barColor: 'bg-[#b7791f]',
  },
  red: {
    iconBg: 'bg-[rgba(180,35,24,0.10)]',
    iconColor: 'text-[#b42318]',
    barColor: 'bg-[#b42318]',
  },
  blue: {
    iconBg: 'bg-[rgba(37,99,235,0.10)]',
    iconColor: 'text-[#2563eb]',
    barColor: 'bg-[#2563eb]',
  },
  indigo: {
    iconBg: 'bg-[rgba(99,102,241,0.10)]',
    iconColor: 'text-[#6366f1]',
    barColor: 'bg-[#6366f1]',
  },
  pink: {
    iconBg: 'bg-[rgba(219,39,119,0.10)]',
    iconColor: 'text-[#db2777]',
    barColor: 'bg-[#db2777]',
  },
};

type DeltaTone = 'good' | 'bad' | 'flat';

const DELTA_STYLE: Record<DeltaTone, string> = {
  good: 'bg-[rgba(34,197,94,0.11)] text-[#18794e]',
  bad: 'bg-[rgba(239,68,68,0.11)] text-[#b42318]',
  flat: 'bg-[#eef4f3] text-[#62716d]',
};

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: Accent;
  /** Optional `↑ Yangi` chip — `null` hides it. */
  delta?: { tone: DeltaTone; text: string } | null;
  /** Bottom bar fill percent (0-100). Defaults to 0 (no fill). */
  fillPct?: number;
};

/**
 * ShifoReyting `.stat` card. White surface, UPPERCASE label, big black
 * number, optional `↑ Yangi` chip, descriptor, icon-in-coloured-box at
 * top-right, and a 3px bottom bar filled to `fillPct` in the accent
 * colour.
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  delta = null,
  fillPct = 0,
}: StatCardProps) {
  const a = ACCENT[accent];

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
            <p className="text-[28px] font-black leading-none text-[#16221f] dark:text-white tabular-nums">
              {value}
            </p>
            {delta ? (
              <span
                className={cn(
                  'inline-flex items-center gap-[3px] px-[7px] py-[2px] rounded text-[11px] font-bold leading-[1.4] whitespace-nowrap',
                  DELTA_STYLE[delta.tone],
                )}
              >
                <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                {delta.text}
              </span>
            ) : null}
          </div>
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
