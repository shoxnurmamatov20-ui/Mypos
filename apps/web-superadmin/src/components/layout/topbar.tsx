'use client';

import { ChevronRight, Home } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CommandPaletteTrigger } from './command-palette-trigger';
import { LanguageSwitcher } from './language-switcher';
import { NotificationBell } from './notification-bell';
import { PeriodFilter } from './period-filter';
import { RegionFilter } from './region-filter';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const KNOWN_SEGMENTS = new Set([
  'dashboard',
  'tenants',
  'billing',
  'audit',
  'admins',
  'settings',
  'login',
  'new',
]);

/**
 * Sticky topbar — 56px tall, frosted glass surface (`backdrop-blur-md`
 * + 80% opacity), separator below. Left side renders a breadcrumb trail
 * (hidden on mobile so the sidebar's own mobile bar handles navigation),
 * right side carries the action chips in the canonical order
 * (cmd, region, bell, period, lang, theme, user).
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
    <header
      role="banner"
      className="hidden lg:flex sticky top-0 z-20 h-14 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/80 supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-900/70"
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6 gap-3">
        {/* Breadcrumbs — hidden on mobile, visible from md+ */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 min-w-0">
          <Link
            href={`/${locale}/dashboard` as Route}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-semibold text-xs transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>Admin</span>
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600 shrink-0"
            aria-hidden="true"
            strokeWidth={2}
          />
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white min-w-0">
            <span className="relative flex h-[7px] w-[7px] shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-600 dark:bg-teal-400 opacity-50 animate-ping" />
              <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-teal-700 dark:bg-teal-400 ring-[3px] ring-teal-500/10 dark:ring-teal-400/15" />
            </span>
            <span className="truncate">{pageLabel}</span>
          </span>
        </nav>

        {/* Right action chips */}
        <div className="flex items-center gap-1.5 ml-auto">
          <CommandPaletteTrigger />
          <RegionFilter />
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
