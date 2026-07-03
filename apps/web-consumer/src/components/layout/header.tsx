'use client';

import { Menu as MenuIcon, Search, ShoppingCart } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { selectCartCount, useCartStore } from '@/stores/cart';
import { HeaderMobileMenu } from './header-mobile-menu';
import { LanguageSwitcher } from './language-switcher';
import { UserMenu } from './user-menu';

export function Header() {
  const t = useTranslations('header');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);
  const [mobileOpen, setMobileOpen] = useState(false);

  const homeHref = `/${locale}` as Route;
  const searchHref = `/${locale}/search` as Route;
  const cartHref = `/${locale}/cart` as Route;
  const loginHref = `/${locale}/login` as Route;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href={homeHref} className="flex items-center gap-2" aria-label="MyPOS">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <span className="text-lg" aria-hidden="true">
                🍽️
              </span>
            </div>
            <span className="font-display text-xl font-extrabold text-neutral-900">MyPOS</span>
          </Link>

          <Link
            href={searchHref}
            className="hidden max-w-md flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500 transition hover:bg-neutral-200 md:flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{t('search_placeholder')}</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />

            <Link
              href={cartHref}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
              aria-label={t('cart')}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {user ? (
              <UserMenu
                user={user}
                locale={locale}
                labels={{
                  profile: t('profile'),
                  orders: t('orders'),
                  logout: tCommon('logout'),
                }}
              />
            ) : (
              <Link
                href={loginHref}
                className="hidden h-10 items-center rounded-full bg-brand-500 px-4 text-white transition hover:bg-brand-600 md:flex"
              >
                <span className="text-sm font-bold">{t('login')}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('menu')}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 md:hidden"
            >
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <HeaderMobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        locale={locale}
        user={user}
        labels={{
          menu: t('menu'),
          home: t('home'),
          restaurants: t('restaurants'),
          orders: t('orders'),
          profile: t('profile'),
          login: t('login'),
        }}
      />
    </header>
  );
}
