'use client';

import { cn } from '@mypos/ui';
import { Calendar, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type DashPeriod = 'today' | 'week' | 'month' | '90d';

const LABELS: Record<DashPeriod, string> = {
  today: 'Bugun',
  week: '7 kun',
  month: '30 kun',
  '90d': '90 kun',
};

type Props = {
  value: DashPeriod;
  onChange: (next: DashPeriod) => void;
};

export function PeriodChip({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const periods: DashPeriod[] = ['today', 'week', 'month', '90d'];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-2.5 text-[12px] font-semibold text-[#16221f] dark:text-white hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] transition-colors outline-none focus:outline-none"
      >
        <Calendar className="h-3.5 w-3.5 text-[#0f766e] dark:text-teal-400" strokeWidth={2.2} />
        <span>{LABELS[value]}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-[#62716d] dark:text-[#94a3b8] transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={2.5}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 mt-2 min-w-[140px] rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] shadow-xl shadow-black/5 dark:shadow-black/30 z-40 overflow-hidden"
        >
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              role="option"
              aria-selected={value === p}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-[12.5px] font-medium transition-colors',
                value === p
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                  : 'text-[#16221f] dark:text-white hover:bg-[#f5f8f7] dark:hover:bg-[#0b1120]',
              )}
            >
              <span>{LABELS[p]}</span>
              {value === p ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
