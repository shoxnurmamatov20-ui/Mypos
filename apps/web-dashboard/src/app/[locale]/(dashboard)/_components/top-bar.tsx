'use client';

import type { AuthUser } from '@mypos/api-client';
import { Home } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const KNOWN_SEGMENTS = new Set([
  'overview',
  'orders',
  'tables',
  'categories',
  'menu',
  'items',
  'inventory',
  'ingredients',
  'customers',
  'employees',
  'shifts',
  'breaks',
  'payments',
  'reports',
  'notifications',
  'log',
  'profile',
  'new',
]);

export interface TopBarProps {
  user: AuthUser;
  locale: string;
  onOpenSidebar?: () => void;
}

export function TopBar({ user, locale }: TopBarProps) {
  const t = useTranslations('top_bar');
  const pathname = usePathname();
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
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          <Link
            href={`/${locale}/overview` as Route}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[#62716d] dark:text-[#94a3b8] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white font-semibold text-[12px] transition-colors"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>{t('home')}</span>
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

        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
          <UserMenu user={user} locale={locale} />
        </div>
      </div>
    </header>
  );
}
