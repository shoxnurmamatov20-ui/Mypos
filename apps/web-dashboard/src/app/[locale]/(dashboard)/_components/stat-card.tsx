'use client';

import { ArrowUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@mypos/ui';

type Accent = 'teal' | 'violet' | 'green' | 'amber' | 'red' | 'blue' | 'indigo' | 'pink';

const ACCENT: Record<Accent, { iconBg: string; iconColor: string; barColor: string }> = {
  teal:   { iconBg: 'bg-[rgba(15,118,110,0.10)]',  iconColor: 'text-[#0f766e]', barColor: 'bg-[#0f766e]' },
  violet: { iconBg: 'bg-[rgba(124,58,237,0.10)]',  iconColor: 'text-[#7c3aed]', barColor: 'bg-[#7c3aed]' },
  green:  { iconBg: 'bg-[rgba(24,121,78,0.10)]',   iconColor: 'text-[#18794e]', barColor: 'bg-[#18794e]' },
  amber:  { iconBg: 'bg-[rgba(183,121,31,0.10)]',  iconColor: 'text-[#b7791f]', barColor: 'bg-[#b7791f]' },
  red:    { iconBg: 'bg-[rgba(180,35,24,0.10)]',   iconColor: 'text-[#b42318]', barColor: 'bg-[#b42318]' },
  blue:   { iconBg: 'bg-[rgba(37,99,235,0.10)]',   iconColor: 'text-[#2563eb]', barColor: 'bg-[#2563eb]' },
  indigo: { iconBg: 'bg-[rgba(99,102,241,0.10)]',  iconColor: 'text-[#6366f1]', barColor: 'bg-[#6366f1]' },
  pink:   { iconBg: 'bg-[rgba(219,39,119,0.10)]',  iconColor: 'text-[#db2777]', barColor: 'bg-[#db2777]' },
};

type DeltaTone = 'good' | 'bad' | 'flat';

const DELTA_STYLE: Record<DeltaTone, string> = {
  good: 'bg-[rgba(34,197,94,0.11)] text-[#18794e] dark:text-emerald-400',
  bad:  'bg-[rgba(239,68,68,0.11)] text-[#b42318] dark:text-red-400',
  flat: 'bg-[#eef4f3] dark:bg-[rgba(255,255,255,0.06)] text-[#62716d] dark:text-[#94a3b8]',
};

type DashStatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: Accent;
  delta?: { tone: DeltaTone; text: string } | null;
  fillPct?: number;
};

/**
 * Manager-panel dashboard stat tile. Ported from web-superadmin: UPPERCASE
 * label, big black tabular-nums number, optional ↑ chip, coloured icon
 * box top-right, 3px bottom progress bar in the accent colour.
 */
export function DashStatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  delta = null,
  fillPct = 0,
}: DashStatCardProps) {
  const a = ACCENT[accent];

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors hover:border-[rgba(15,118,110,0.20)] dark:hover:border-[rgba(20,184,166,0.20)] min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] mb-2 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
            <p className="text-[24px] sm:text-[26px] md:text-[28px] font-black leading-none text-[#16221f] dark:text-white tabular-nums break-words">
              {value}
            </p>
            {delta ? (
              <span
                className={cn(
                  'inline-flex items-center gap-[3px] px-[7px] py-[2px] rounded text-[11px] font-bold leading-[1.4] whitespace-nowrap',
                  DELTA_STYLE[delta.tone],
                )}
              >
                <ArrowUp className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                {delta.text}
              </span>
            ) : null}
          </div>
          {sub ? (
            <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate">{sub}</p>
          ) : null}
        </div>

        <div
          className={cn(
            'grid h-[34px] w-[34px] place-items-center rounded-[10px] flex-shrink-0',
            a.iconBg,
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-[17px] w-[17px]', a.iconColor)} strokeWidth={2} />
        </div>
      </div>

      <div
        className="mt-2.5 h-[3px] rounded-[2px] bg-[rgba(22,34,31,0.06)] dark:bg-[rgba(255,255,255,0.06)] overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.max(0, Math.min(100, fillPct))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} bar`}
      >
        <div
          className={cn('h-full rounded-[2px] transition-[width] duration-500', a.barColor)}
          style={{ width: `${Math.max(0, Math.min(100, fillPct))}%` }}
        />
      </div>
    </div>
  );
}
