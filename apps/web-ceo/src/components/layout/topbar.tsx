'use client';

import { Home } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CommandPaletteTrigger } from './command-palette-trigger';
import { LanguageSwitcher } from './language-switcher';
import { NotificationBell } from './notification-bell';
import { PeriodFilter } from './period-filter';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const KNOWN_SEGMENTS = new Set([
  'overview',
  'restaurants',
  'clinics',
  'feedback',
  'finances',
  'login',
]);

/**
 * ShifoReyting topbar — sticky 58px white-frosted bar.
 *   Left:  `[home] CEO › [●pulse] PageName`
 *   Right: cmd-trigger, bell, period-filter, lang-drop, theme-btn, user-chip.
 *
 * Hidden on mobile (the sidebar provides its own mobile top bar).
 */
export function Topbar() {
  const t = useTranslations('topbar');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  // Strip leading "/" + locale segment.
  const segments = pathname.split('/').filter(Boolean).slice(1);
  const lastSegment = segments[segments.length - 1] ?? '';
  const pageLabel =
    segments.length === 0
      ? t('home')
      : KNOWN_SEGMENTS.has(lastSegment)
        ? t(lastSegment)
        : decodeURIComponent(lastSegment);

  return (
    <header className="hidden lg:flex sticky top-0 z-20 h-[58px] backdrop-blur-xl border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white/[0.92] dark:bg-[#0b1120]/[0.88]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 gap-3">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          <Link
            href={`/${locale}/overview` as Route}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[#62716d] dark:text-[#94a3b8] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white font-semibold text-[12px] transition-colors"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>CEO</span>
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

        {/* Right action chips */}
        <div className="flex items-center gap-1.5">
          <CommandPaletteTrigger />
          <NotificationBell />
          <PeriodFilter />
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
