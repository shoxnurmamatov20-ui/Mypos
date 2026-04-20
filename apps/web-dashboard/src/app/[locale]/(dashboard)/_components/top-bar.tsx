'use client';

import type { AuthUser } from '@mypos/api-client';
import { Bell, Menu as MenuIcon, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { UserMenu } from './user-menu';

export interface TopBarProps {
  user: AuthUser;
  locale: string;
  onOpenSidebar: () => void;
}

export function TopBar({ user, locale, onOpenSidebar }: TopBarProps) {
  const t = useTranslations('top_bar');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label={t('user_menu')}
        className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50 md:hidden"
      >
        <MenuIcon className="h-5 w-5" aria-hidden />
      </button>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder={t('search_placeholder')}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <LanguageSwitcher currentLocale={locale} />

        <button
          type="button"
          aria-label={t('notifications')}
          className="relative rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 hover:bg-neutral-50"
        >
          <Bell className="h-4 w-4" aria-hidden />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger"
            aria-hidden
          />
        </button>

        <UserMenu user={user} locale={locale} />
      </div>
    </header>
  );
}
