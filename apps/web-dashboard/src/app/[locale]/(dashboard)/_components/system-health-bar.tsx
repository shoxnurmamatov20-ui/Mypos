'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Health = { id: string; label: string; tone: 'ok' | 'warn' | 'err' };

const TONE_DOT: Record<Health['tone'], string> = {
  ok: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]',
  warn: 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]',
  err: 'bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]',
};

const TONE_TEXT: Record<Health['tone'], string> = {
  ok: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  err: 'text-rose-700 dark:text-rose-400',
};

/**
 * Restaurant-side system health strip. 4 status dots + live UZ clock.
 * Values are decorative for now (mirror superadmin pattern); wire to
 * real `/api/v1/health/*` endpoints in a follow-up.
 */
export function SystemHealthBar() {
  const t = useTranslations('overview.health');
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const fmt = new Intl.DateTimeFormat('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Tashkent',
      });
      setTime(fmt.format(d));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const items: Health[] = [
    { id: 'restaurant', label: t('restaurant'), tone: 'ok' },
    { id: 'kitchen', label: t('kitchen'), tone: 'ok' },
    { id: 'cashier', label: t('cashier'), tone: 'ok' },
    { id: 'kds', label: t('kds'), tone: 'ok' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2">
            <span
              className={`block h-[7px] w-[7px] rounded-full ${TONE_DOT[it.tone]}`}
              aria-hidden
            />
            <span className={`text-[12px] font-semibold tabular-nums ${TONE_TEXT[it.tone]}`}>
              {it.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[12px] text-[#62716d] dark:text-[#94a3b8]">
        <span className="font-medium">Tashkent</span>
        <span className="font-mono text-[#16221f] dark:text-white tabular-nums tracking-wider">
          {time || '—'}
        </span>
      </div>
    </div>
  );
}
