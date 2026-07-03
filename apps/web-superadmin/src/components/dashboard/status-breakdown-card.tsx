'use client';

import { Activity, AlertCircle, CheckCircle, Clock, Inbox, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const STATUS_STYLE = {
  active: { color: '#10b981', bg: 'bg-emerald-500', label: 'Faol', icon: CheckCircle },
  trialing: { color: '#3b82f6', bg: 'bg-blue-500', label: 'Sinov', icon: Clock },
  past_due: { color: '#f59e0b', bg: 'bg-amber-500', label: 'Kechikdi', icon: AlertCircle },
  suspended: { color: '#ef4444', bg: 'bg-red-500', label: "To'xtatilgan", icon: XCircle },
} as const;

type Props = {
  counts: Record<keyof typeof STATUS_STYLE, number>;
  total: number;
};

/** Horizontal status bars: per-status count + percent + colour-tinted fill. */
export function StatusBreakdownCard({ counts, total }: Props) {
  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[rgba(255,255,255,0.07)] rounded-xl transition-colors">
      <div className="p-4 pb-3 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          Tenant holatlari
        </h3>
      </div>
      <div className="p-4 pt-0 space-y-3">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center h-[180px] text-gray-400 dark:text-gray-500">
            <Inbox className="w-7 h-7 mb-2" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm font-medium">Ma&apos;lumot yo&apos;q</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
              Tenantlar holati bu yerda ko&apos;rinadi
            </p>
          </div>
        ) : (
          (Object.keys(STATUS_STYLE) as Array<keyof typeof STATUS_STYLE>).map((key) => {
            const s = STATUS_STYLE[key];
            const value = counts[key];
            const pct = total ? (value / total) * 100 : 0;
            const Icon = s.icon;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: s.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      {value}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-2 bg-gray-100 dark:bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.label}: ${pct.toFixed(0)}%`}
                >
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', s.bg)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const STATUS_KEYS = Object.keys(STATUS_STYLE) as Array<keyof typeof STATUS_STYLE>;
