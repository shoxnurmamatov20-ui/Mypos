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

const STORAGE_KEY = 'mypos_admin_period';

/**
 * Period filter — 32px chip with calendar icon + current label +
 * chevron. Selection persists in localStorage so other widgets can
 * subscribe via the `mypos:period-change` custom event.
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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Davr: ${currentLabel}`}
        className={cn(
          'hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 transition-colors duration-150',
          'border-gray-200 bg-white text-gray-900 hover:bg-gray-100',
          'dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
          'text-xs font-bold',
        )}
      >
        <Calendar
          className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="tabular-nums">{currentLabel}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-gray-500 dark:text-gray-400 transition-transform duration-150',
            open && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Davr tanlash"
          className="absolute right-0 top-full mt-1 min-w-[160px] p-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg shadow-gray-900/10 dark:shadow-gray-900/40 z-50 overflow-hidden"
        >
          {PERIODS.map((p) => {
            const isActive = p.key === current;
            return (
              <button
                key={p.key}
                type="button"
                role="menuitem"
                onClick={() => change(p.key)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800',
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                    : 'text-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
                )}
              >
                <span className="tabular-nums">{p.label}</span>
                {isActive ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-700 dark:bg-teal-400"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
