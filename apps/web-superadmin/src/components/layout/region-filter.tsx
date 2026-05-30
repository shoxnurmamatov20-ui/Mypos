'use client';

import { ChevronDown, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const REGIONS = [
  { code: '', name: 'Hamma viloyatlar' },
  { code: 'tas', name: 'Toshkent' },
  { code: 'sam', name: 'Samarqand' },
  { code: 'buk', name: 'Buxoro' },
  { code: 'and', name: 'Andijon' },
  { code: 'fer', name: "Farg'ona" },
  { code: 'nam', name: 'Namangan' },
  { code: 'kar', name: 'Qashqadaryo' },
  { code: 'sur', name: 'Surxondaryo' },
  { code: 'jiz', name: 'Jizzax' },
  { code: 'sir', name: 'Sirdaryo' },
  { code: 'nav', name: 'Navoiy' },
  { code: 'kho', name: 'Xorazm' },
  { code: 'kar2', name: "Qoraqalpog'iston" },
];

const STORAGE_KEY = 'mypos_admin_region';

/**
 * Region filter — chip with a map-pin icon. Lists every UZ region plus
 * the "Hamma viloyatlar" reset. Selection is broadcast via
 * `mypos:region-change` so subscribed widgets can re-query.
 */
export function RegionFilter() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? '';
    setCurrent(stored);
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

  const change = (code: string) => {
    setCurrent(code);
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, code);
      window.dispatchEvent(new CustomEvent('mypos:region-change', { detail: { code } }));
    }
  };

  const currentLabel = REGIONS.find((r) => r.code === current)?.name ?? 'Hamma viloyatlar';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Viloyat: ${currentLabel}`}
        title="Viloyat filtri"
        className={cn(
          'hidden lg:inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 transition-colors duration-150',
          'border-gray-200 bg-white text-gray-900 hover:bg-gray-100',
          'dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
          'text-xs font-bold max-w-[200px]',
        )}
      >
        <MapPin
          className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-gray-500 dark:text-gray-400 transition-transform duration-150 shrink-0',
            open && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Viloyat tanlash"
          className="absolute right-0 top-full mt-1 min-w-[220px] max-h-[320px] overflow-y-auto p-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg shadow-gray-900/10 dark:shadow-gray-900/40 z-50"
        >
          {REGIONS.map((r) => {
            const isActive = r.code === current;
            return (
              <button
                key={r.code || 'all'}
                type="button"
                role="menuitem"
                onClick={() => change(r.code)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800',
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                    : 'text-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
                )}
              >
                <span className="truncate text-left">{r.name}</span>
                {isActive ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-700 dark:bg-teal-400 shrink-0"
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
