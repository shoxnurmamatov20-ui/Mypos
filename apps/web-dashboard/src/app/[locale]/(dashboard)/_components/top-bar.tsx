'use client';

import type { AuthUser } from '@mypos/api-client';
import { ChevronRight, Home } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CommandPaletteTrigger } from './command-palette';
import { LanguageSwitcher } from './language-switcher';
import { SECTIONS } from './nav-config';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

/**
 * Sticky topbar — 56px, frosted glass, separator below. Left is a breadcrumb
 * trail, right carries the action chips in the super-admin's canonical order
 * (cmd, bell, lang, theme, user).
 *
 * The crumb label is resolved from `nav-config` rather than a hand-kept set of
 * segment names, so a page like `inventory/incoming-log` shows its translated
 * title instead of the raw slug.
 */
const LABEL_BY_HREF = new Map<string, string>([
  ...SECTIONS.flatMap((s) => (s.items ?? []).map((it) => [it.href, it.id] as const)),
  ...SECTIONS.filter((s) => s.href).map((s) => [s.href as string, s.id] as const),
]);

/** `orders/123/edit` → `orders/123` → `orders`: a detail route inherits its parent's name. */
function resolveLabelId(href: string): string | undefined {
  const parts = href.split('/');
  for (let i = parts.length; i > 0; i--) {
    const id = LABEL_BY_HREF.get(parts.slice(0, i).join('/'));
    if (id) return id;
  }
  return undefined;
}

export interface TopBarProps {
  user: AuthUser;
  locale: string;
  onOpenSidebar?: () => void;
}

export function TopBar({ user, locale }: TopBarProps) {
  const t = useTranslations('top_bar');
  const tSide = useTranslations('sidebar');
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean).slice(1);
  const labelId = resolveLabelId(segments.join('/'));
  const pageLabel =
    segments.length === 0
      ? t('home')
      : labelId
        ? tSide(labelId)
        : decodeURIComponent(segments[segments.length - 1] ?? '');

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 hidden h-14 border-b border-gray-200/70 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 lg:flex dark:border-gray-800/70 dark:bg-gray-900/80 supports-[backdrop-filter]:dark:bg-gray-900/70"
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 lg:px-6">
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 md:flex">
          <Link
            href={`/${locale}/overview` as Route}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white dark:focus-visible:ring-offset-gray-900"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>{t('home')}</span>
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
            strokeWidth={2}
          />
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <span className="relative flex h-[7px] w-[7px] shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-600 opacity-50 dark:bg-teal-400" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-teal-700 ring-[3px] ring-teal-500/10 dark:bg-teal-400 dark:ring-teal-400/15" />
            </span>
            <span className="truncate">{pageLabel}</span>
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <CommandPaletteTrigger />
          <NotificationBell />
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
          <UserMenu user={user} locale={locale} />
        </div>
      </div>
    </header>
  );
}
