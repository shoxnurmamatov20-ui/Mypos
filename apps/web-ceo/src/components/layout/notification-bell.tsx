'use client';

import { Bell, BellOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * ShifoReyting-style bell-btn — 32×32 surface chip with 1px border, red
 * `bell-badge` corner badge when unread > 0. Opens a small dropdown
 * with the recent platform events.
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

  // TODO: wire to /api/v1/ceo/notifications when ready.
  const unseenCount = 0;
  const items: Array<{ id: number; title: string; subtitle: string }> = [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
          'border-[rgba(22,34,31,0.09)] bg-white text-[#62716d] hover:bg-[#eef4f3] hover:text-[#16221f]',
          'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:text-[#94a3b8]',
          'dark:hover:bg-[#1a2235] dark:hover:text-white',
          open && 'bg-[#eef4f3] text-[#16221f] dark:bg-[#1a2235] dark:text-white',
        )}
        title="Bildirishnomalar"
        aria-label="Bildirishnomalar"
      >
        <Bell className="h-[15px] w-[15px]" strokeWidth={2} />
        {unseenCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-lg bg-[#b42318] text-white text-[9px] font-extrabold leading-none">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
            <p className="text-[13px] font-bold text-[#16221f] dark:text-white">Bildirishnomalar</p>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-9 text-[#62716d] dark:text-[#94a3b8]">
                <BellOff className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
                <p className="text-[12px]">Hozircha xabar yo&apos;q</p>
              </div>
            ) : (
              items.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] last:border-b-0 transition-colors"
                >
                  <p className="text-[13px] font-semibold text-[#16221f] dark:text-white truncate">
                    {it.title}
                  </p>
                  <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate mt-0.5">
                    {it.subtitle}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="px-3.5 py-2 border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
            <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
              {items.length} ta yangi xabar
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
