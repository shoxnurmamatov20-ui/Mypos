'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type Status = 'ok' | 'warn' | 'down';

type HealthItem = {
  label: string;
  value: string;
  status: Status;
  title?: string;
};

const STATUS_DOT: Record<Status, string> = {
  ok: 'bg-[#18794e] shadow-[0_0_0_2px_rgba(34,197,94,0.18)]',
  warn: 'bg-[#b7791f] shadow-[0_0_0_2px_rgba(245,158,11,0.20)]',
  down: 'bg-[#b42318] shadow-[0_0_0_2px_rgba(239,68,68,0.20)]',
};

const ITEMS: ReadonlyArray<HealthItem> = [
  { label: 'DB', value: 'OK', status: 'ok', title: "Ma'lumotlar bazasi" },
  { label: 'Queue', value: 'Idle', status: 'ok', title: 'Vazifalar navbati' },
  { label: 'Telegram', value: 'Not configured', status: 'warn', title: 'Telegram integratsiyasi' },
  { label: 'Cache', value: 'OK', status: 'ok', title: 'Cache holati' },
];

/**
 * ShifoReyting `health-bar` — slim horizontal status strip rendered at
 * the top of the dashboard. Each item is `[●] LABEL VALUE`. Right side
 * shows the wall-clock time (HH:mm:ss), updated every second so the
 * page never feels stale.
 */
export function SystemHealthBar() {
  const [now, setNow] = useState<string>(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center gap-3 sm:gap-[18px] px-3.5 py-2 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[12px] flex-wrap transition-colors"
      role="status"
      aria-label="Tizim holati"
    >
      {ITEMS.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-[7px]" title={it.title}>
          <span
            className={cn('h-[7px] w-[7px] rounded-full flex-shrink-0', STATUS_DOT[it.status])}
            aria-hidden="true"
          />
          <span className="text-[#62716d] dark:text-[#94a3b8] font-semibold">{it.label}</span>
          <span className="text-[#16221f] dark:text-white font-bold">{it.value}</span>
        </span>
      ))}
      <span
        className="ml-auto text-[#62716d] dark:text-[#94a3b8] font-medium text-[11px] tabular-nums tracking-[0.02em]"
        aria-live="off"
      >
        {now}
      </span>
    </div>
  );
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
