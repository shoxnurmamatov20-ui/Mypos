import type { ReactNode } from 'react';
import { cn } from '../cn';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  delta?: { value: string; positive?: boolean } | null;
  hint?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, delta, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        'border-[rgba(22,34,31,0.09)] bg-white',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#62716d] dark:text-[#94a3b8]">
            {label}
          </p>
          <p className="mt-2 text-[24px] font-bold tracking-tight text-[#16221f] dark:text-white leading-none tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-1.5 text-xs text-[#62716d] dark:text-[#94a3b8]">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef4f3] dark:bg-[#1a2235] text-[#0f766e] dark:text-teal-400 shrink-0">
            {icon}
          </div>
        ) : null}
      </div>
      {delta ? (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-[12px] font-semibold',
            delta.positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400',
          )}
        >
          <span>{delta.positive ? '↑' : '↓'}</span>
          <span>{delta.value}</span>
        </div>
      ) : null}
    </div>
  );
}
