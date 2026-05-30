'use client';

import { ChefHat } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { pageLabelFor } from '@/lib/nav';
import { useKitchenSession } from '@/lib/session';
import { ThemeToggle } from './theme-toggle';

/**
 * Kitchen topbar — the web-superadmin sticky 58px frosted bar, trimmed
 * to what a cook actually needs:
 *   Left:  `[chef] Kitchen › [●pulse] PageName`
 *   Right: live wall clock, theme toggle, station chip
 *
 * No command palette, region filter, period filter or notification
 * bell — those are platform-admin chrome, not kitchen tools.
 * Hidden on mobile (the sidebar provides its own mobile top bar).
 */
export function Topbar() {
  const pathname = usePathname();
  const pageLabel = pageLabelFor(pathname);

  return (
    <header className="hidden lg:flex sticky top-0 z-20 h-[58px] backdrop-blur-xl border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white/[0.92] dark:bg-[#0b1120]/[0.88]">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 gap-3">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          <Link
            href={'/board' as Route}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[#62716d] dark:text-[#94a3b8] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white font-semibold text-[12px] transition-colors"
          >
            <ChefHat className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>Kitchen</span>
          </Link>
          <span className="text-[#62716d] dark:text-[#94a3b8] text-[15px] leading-none select-none opacity-60">
            ›
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#16221f] dark:text-white">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#0f766e] opacity-50 animate-ping" />
              <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#0f766e] ring-[3px] ring-[rgba(15,118,110,0.1)]" />
            </span>
            <span className="truncate">{pageLabel}</span>
          </span>
        </nav>

        {/* Right — wall clock, theme, station chip */}
        <div className="flex items-center gap-2.5">
          <LiveClock />
          <ThemeToggle />
          <StationChip />
        </div>
      </div>
    </header>
  );
}

/** Tabular-numeral wall clock — kitchens run on the clock. */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const label =
    now === null
      ? '--:--:--'
      : [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map((n) => String(n).padStart(2, '0'))
          .join(':');

  return (
    <span
      className="font-mono text-[13px] font-semibold tabular-nums text-[#16221f] dark:text-white px-2.5 py-1 rounded-md bg-[#eef4f3] dark:bg-[#1a2235] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]"
      title="Joriy vaqt"
    >
      {label}
    </span>
  );
}

/** Read-only cook identity chip — mirrors web-superadmin's user chip. */
function StationChip() {
  const { user } = useKitchenSession();
  const initial = (user.name?.trim()?.charAt(0) ?? user.email.charAt(0) ?? 'K').toUpperCase();
  const displayName = user.name || user.email;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border',
        'border-[rgba(22,34,31,0.09)] bg-[#eef4f3]',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235]',
      )}
    >
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#14b8a6] text-white text-[11px] font-extrabold">
        {initial}
      </span>
      <span className="text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] max-w-[140px] truncate">
        {displayName}
      </span>
    </div>
  );
}
