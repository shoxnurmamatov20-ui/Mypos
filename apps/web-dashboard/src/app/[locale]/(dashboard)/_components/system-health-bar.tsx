'use client';

import { cn } from '@mypos/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

type Status = 'ok' | 'warn' | 'down';

type HealthComponent = { status: string; latency_ms?: number };
type HealthResponse = { status: string; components?: Record<string, HealthComponent> };

const STATUS_DOT: Record<Status, string> = {
  ok: 'bg-[#18794e] shadow-[0_0_0_2px_rgba(34,197,94,0.18)]',
  warn: 'bg-[#b7791f] shadow-[0_0_0_2px_rgba(245,158,11,0.20)]',
  down: 'bg-[#b42318] shadow-[0_0_0_2px_rgba(239,68,68,0.20)]',
};

/**
 * `health-bar` — the super-admin status strip, rendered `[●] LABEL VALUE` with
 * the wall clock on the right.
 *
 * One deliberate difference from the super-admin version: those four items are
 * hardcoded there, so the strip can never report a problem. Here it reads
 * `/api/v1/health`, which already returns db / redis / cache / queue with their
 * measured latency — identical chrome, real values.
 */
function toStatus(raw: string): Status {
  return raw === 'ok' ? 'ok' : raw === 'degraded' ? 'warn' : 'down';
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tashkent',
  }).format(d);
}

export function SystemHealthBar() {
  const [now, setNow] = useState<string>('');

  const { data, isError, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient.get<HealthResponse>('/api/v1/health'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    setNow(formatTime(new Date()));
    const id = setInterval(() => setNow(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  const components = Object.entries(data?.components ?? {});
  const unknown = isLoading || isError || !data;

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3.5 py-2 text-[12px] transition-colors sm:gap-[18px] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]"
      role="status"
      aria-label="Tizim holati"
    >
      {unknown ? (
        <span className="inline-flex items-center gap-[7px]">
          <span
            className={cn('h-[7px] w-[7px] flex-shrink-0 rounded-full', STATUS_DOT.warn)}
            aria-hidden="true"
          />
          <span className="font-semibold text-[#62716d] dark:text-[#94a3b8]">API</span>
          <span className="font-bold text-[#16221f] dark:text-white">—</span>
        </span>
      ) : (
        components.map(([name, c]) => {
          const status = toStatus(c.status);
          return (
            <span key={name} className="inline-flex items-center gap-[7px]">
              <span
                className={cn('h-[7px] w-[7px] flex-shrink-0 rounded-full', STATUS_DOT[status])}
                aria-hidden="true"
              />
              <span className="font-semibold text-[#62716d] uppercase dark:text-[#94a3b8]">
                {name}
              </span>
              <span className="font-bold text-[#16221f] tabular-nums dark:text-white">
                {status === 'ok' && typeof c.latency_ms === 'number'
                  ? `${c.latency_ms.toFixed(1)} ms`
                  : c.status}
              </span>
            </span>
          );
        })
      )}

      <span
        className="ml-auto text-[11px] font-medium tracking-[0.02em] text-[#62716d] tabular-nums dark:text-[#94a3b8]"
        aria-live="off"
      >
        {now || '—'}
      </span>
    </div>
  );
}
