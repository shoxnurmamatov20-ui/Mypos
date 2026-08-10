'use client';

import { cn } from '@mypos/ui';
import { House, Plus, UserCircle } from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * Mobile-only bottom tab bar (`lg:hidden`) — replaces the old hamburger
 * drawer. Two real tabs plus a raised center FAB for "new order", mirroring
 * `WaiterSidebar`'s CTA. iOS convention: the active tab recolors icon+label
 * only, no background tint (that treatment is reserved for the sidebar's
 * list-selection affordance).
 */
export function WaiterBottomNav() {
  const t = useTranslations('waiter');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  const homeHref = `/${locale}/tables` as Route;
  const accountHref = `/${locale}/account` as Route;
  const isHome =
    pathname === homeHref ||
    pathname.startsWith(`/${locale}/orders`) ||
    pathname.startsWith(`/${locale}/menu`);
  const isAccount = pathname.startsWith(accountHref) || pathname.startsWith(`/${locale}/shift`);

  // The new-order flow owns the bottom edge (sticky cart bar) — the tab
  // bar steps aside for the duration of the flow.
  if (pathname.startsWith(`/${locale}/new-order`)) return null;

  return (
    <nav
      className="sticky bottom-0 z-30 flex items-end justify-around border-t border-hairline-soft bg-canvas/85 px-5 pb-[calc(9px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      aria-label="Primary"
    >
      <Link
        href={homeHref}
        aria-current={isHome ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center gap-1 px-3 py-1 text-micro-legal transition-transform active:scale-90',
          isHome ? 'font-semibold text-tenant' : 'font-regular text-ink-muted-48',
        )}
      >
        <House className="h-[22px] w-[22px]" weight={isHome ? 'fill' : 'regular'} />
        {t('nav.home')}
      </Link>

      <Link
        href={`/${locale}/new-order` as Route}
        aria-label={t('nav.newOrder')}
        className="-mt-6 grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-tenant text-tenant-on-primary shadow-product transition-transform active:scale-90"
      >
        <Plus className="h-5 w-5" weight="bold" />
      </Link>

      <Link
        href={accountHref}
        aria-current={isAccount ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center gap-1 px-3 py-1 text-micro-legal transition-transform active:scale-90',
          isAccount ? 'font-semibold text-tenant' : 'font-regular text-ink-muted-48',
        )}
      >
        <UserCircle className="h-[22px] w-[22px]" weight={isAccount ? 'fill' : 'regular'} />
        {t('nav.account')}
      </Link>
    </nav>
  );
}
