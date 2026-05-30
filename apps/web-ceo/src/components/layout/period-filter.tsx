'use client';

import { Calendar, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const PERIODS = [
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: '90d', label: '90 kun' },
  { key: '1y', label: '1 yil' },
] as const;

const STORAGE_KEY = 'mypos_ceo_period';

/**
 * ShifoReyting `period-filter` — 32px chip with calendar icon + current
 * label + chevron, opens a tiny dropdown of preset windows. Selection
 * persists in localStorage so other widgets can subscribe via the
 * `mypos:period-change` custom event.
 */
export function PeriodFilter() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<(typeof PERIODS)[number]['key']>('30d');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as
      | (typeof PERIODS)[number]['key']
      | null;
    if (stored && PERIODS.some((p) => p.key === stored)) setCurrent(stored);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const change = (key: (typeof PERIODS)[number]['key']) => {
    setCurrent(key);
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, key);
      window.dispatchEvent(new CustomEvent('mypos:period-change', { detail: { key } }));
    }
  };

  const currentLabel = PERIODS.find((p) => p.key === current)?.label ?? '30 kun';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 transition-colors',
          'border-[rgba(22,34,31,0.09)] bg-white text-[#16221f] hover:bg-[#eef4f3]',
          'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:text-white dark:hover:bg-[#1a2235]',
          'text-[12px] font-bold',
        )}
      >
        <Calendar className="h-3.5 w-3.5 text-[#62716d] dark:text-[#94a3b8]" strokeWidth={2} />
        <span>{currentLabel}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-[#62716d] dark:text-[#94a3b8] transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
        >
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => change(p.key)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-[12px] font-semibold transition-colors',
                p.key === current
                  ? 'bg-[rgba(15,118,110,0.1)] text-[#0f766e] dark:bg-[rgba(20,184,166,0.18)] dark:text-[#14b8a6]'
                  : 'text-[#16221f] hover:bg-[#eef4f3] dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]',
              )}
            >
              <span>{p.label}</span>
              {p.key === current ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e]" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
