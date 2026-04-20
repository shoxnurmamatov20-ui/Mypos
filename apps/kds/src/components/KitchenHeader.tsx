'use client';

import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

type KitchenHeaderProps = {
  userName: string | null;
  isRefreshing: boolean;
  onLogout: () => void;
};

function formatClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function KitchenHeader({
  userName,
  isRefreshing,
  onLogout,
}: KitchenHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Initialise after mount to avoid SSR/CSR drift.
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-neutral-700 bg-neutral-800 px-8 py-5">
      <div className="flex items-center gap-6">
        <h1 className="font-display text-3xl font-bold text-brand-400">
          MyPOS Kitchen
        </h1>
        <span
          className={`inline-flex h-3 w-3 rounded-full ${
            isRefreshing
              ? 'animate-pulse bg-mint-500'
              : 'bg-mint-500/40'
          }`}
          aria-label={isRefreshing ? 'Yangilanmoqda' : 'Real vaqt rejimi'}
        />
      </div>

      <div className="flex items-center gap-8">
        <div className="font-mono text-3xl font-bold tabular-nums text-neutral-100">
          {now === null ? '--:--:--' : formatClock(now)}
        </div>
        {userName !== null && (
          <span className="text-lg text-neutral-300">{userName}</span>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700 px-5 py-3 text-base font-semibold text-neutral-100 transition hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        >
          <LogOut className="h-5 w-5" />
          Chiqish
        </button>
      </div>
    </header>
  );
}
