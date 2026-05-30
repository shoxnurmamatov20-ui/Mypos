'use client';

import { Bell } from 'lucide-react';
import { useState } from 'react';

/**
 * Topbar notification bell — placeholder UI. Click reveals a panel
 * with empty state for now; wire to `/api/v1/notifications/log` later.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Bildirishnomalar"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[#62716d] dark:text-[#94a3b8] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white transition-colors outline-none focus:outline-none"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        <span
          aria-hidden
          className="absolute top-2 right-2 inline-flex h-[7px] w-[7px] rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b1120]"
        />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Bildirishnomalar"
            className="absolute right-0 mt-2 w-[300px] rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] shadow-xl shadow-black/5 dark:shadow-black/30 z-40 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#16221f] dark:text-white">
                Bildirishnomalar
              </p>
              <span className="text-[11px] font-medium text-[#62716d] dark:text-[#94a3b8]">
                3 yangi
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto py-1">
              {[
                { tone: 'rose', title: "Ombor: 'Pomidor' kam qoldi", time: '5 min oldin' },
                { tone: 'amber', title: 'Yangi buyurtma — №O260528-0042', time: '14 min oldin' },
                { tone: 'emerald', title: "To'lov qabul qilindi — 187K so'm", time: '23 min oldin' },
              ].map((it) => (
                <div
                  key={it.title}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#f5f8f7] dark:hover:bg-[#0b1120] transition-colors"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      it.tone === 'rose'
                        ? 'bg-rose-500'
                        : it.tone === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-[#16221f] dark:text-white truncate">
                      {it.title}
                    </p>
                    <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8] mt-0.5">
                      {it.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)]">
              <button
                type="button"
                className="w-full text-center text-[12px] font-semibold text-[#0f766e] dark:text-teal-400 hover:underline"
                onClick={() => setOpen(false)}
              >
                Barchasini ko'rish
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
