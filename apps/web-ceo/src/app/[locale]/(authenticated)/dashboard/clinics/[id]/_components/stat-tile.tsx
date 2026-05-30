import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Compact stat tile used in the clinic detail header — icon + label +
 * tabular-numeral value. `tone` highlights danger metrics (e.g. urgent
 * complaints) in red.
 */
export function StatTile({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'danger' | 'warning';
}) {
  return (
    <div className="rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p
        className={cn(
          'mt-1.5 text-[20px] font-black tabular-nums leading-none',
          tone === 'danger' && 'text-[#b42318] dark:text-red-300',
          tone === 'warning' && 'text-amber-600 dark:text-amber-300',
          tone === 'default' && 'text-[#16221f] dark:text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}
