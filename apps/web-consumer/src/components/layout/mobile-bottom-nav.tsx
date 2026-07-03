'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth';
import { selectCartCount, useCartStore } from '@/stores/cart';

type Tab = {
  key: 'home' | 'search' | 'cart' | 'profile';
  href: Route;
  icon: React.ElementType;
  match: (pathname: string, locale: string) => boolean;
};

export function MobileBottomNav() {
  const t = useTranslations('mobile_nav');
  const locale = useLocale();
  const pathname = usePathname();
  const cartCount = useCartStore(selectCartCount);
  const user = useAuthStore((s) => s.user);

  const profileHref = (user ? `/${locale}/profile` : `/${locale}/login`) as Route;

  const tabs: Tab[] = [
    {
      key: 'home',
      href: `/${locale}` as Route,
      icon: Home,
      match: (p, l) => p === `/${l}` || p === `/${l}/`,
    },
    {
      key: 'search',
      href: `/${locale}/search` as Route,
      icon: Search,
      match: (p, l) => p.startsWith(`/${l}/search`) || p.startsWith(`/${l}/restaurants`),
    },
    {
      key: 'cart',
      href: `/${locale}/cart` as Route,
      icon: ShoppingBag,
      match: (p, l) => p.startsWith(`/${l}/cart`) || p.startsWith(`/${l}/checkout`),
    },
    {
      key: 'profile',
      href: profileHref,
      icon: User,
      match: (p, l) =>
        p.startsWith(`/${l}/profile`) ||
        p.startsWith(`/${l}/orders`) ||
        p.startsWith(`/${l}/login`) ||
        p.startsWith(`/${l}/register`),
    },
  ];

  return (
    <nav
      aria-label={t('home')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, locale);
          const showBadge = tab.key === 'cart' && cartCount > 0;

          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                className={`relative flex h-full flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${
                  active ? 'text-brand-500' : 'text-neutral-400 hover:text-neutral-600'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <AnimatePresence>
                    {showBadge ? (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white"
                        aria-label={`${cartCount}`}
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span>{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
