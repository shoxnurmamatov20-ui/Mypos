'use client';

import { Bell, BellOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Notification bell — 32×32 surface chip with an unread count badge in
 * the corner. Opens a hover-card preview list of the most recent
 * platform events. List is empty until `/api/v1/super-admin/notifications`
 * ships, so right now this stays in the "no unread" state.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // TODO: wire to /api/v1/super-admin/notifications when ready.
  const unseenCount = 0;
  const items: Array<{ id: number; title: string; subtitle: string }> = [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150',
          'border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900',
          'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
          'dark:hover:bg-gray-800 dark:hover:text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
          open && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
        )}
        title="Bildirishnomalar"
        aria-label={`Bildirishnomalar${unseenCount > 0 ? ` (${unseenCount} ta yangi)` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden="true" />
        {unseenCount > 0 ? (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-extrabold leading-none ring-2 ring-white dark:ring-gray-900"
            aria-hidden="true"
          >
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Bildirishnomalar"
          className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg shadow-gray-900/10 dark:shadow-gray-900/40 z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Bildirishnomalar
            </p>
            {items.length > 0 ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 tabular-nums">
                {items.length}
              </span>
            ) : null}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-gray-500 dark:text-gray-400 text-center">
                <BellOff className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-xs font-medium">Hozircha xabar yo&apos;q</p>
                <p className="text-[11px] mt-1 opacity-70">
                  Yangi platforma hodisalari shu yerda paydo bo&apos;ladi
                </p>
              </div>
            ) : (
              items.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  role="menuitem"
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors duration-150 focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-gray-800/60"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-500/15 flex items-center justify-center flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      <Bell className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {it.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {it.subtitle}
                      </p>
                    </div>
                    <ExternalLink
                      className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
              {items.length} ta yangi xabar
            </p>
            <Link
              href={'/uz/audit' as Route}
              onClick={() => setOpen(false)}
              className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
            >
              Audit log →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
