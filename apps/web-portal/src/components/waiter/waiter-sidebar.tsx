'use client';

import { cn } from '@mypos/ui';
import { House, Plus, SignOut, Storefront, UserCircle } from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { logout as apiLogout } from '@/lib/api';
import { clearWaiterSession, useWaiterSession } from '@/lib/waiter-session';

/**
 * Waiter-panel desktop sidebar (`lg:` and up — mobile uses
 * `WaiterBottomNav` instead of a drawer). Two real destinations plus a
 * standing "new order" action, matching the tenant single-accent rule:
 * the CTA is the only fully-filled surface, the active nav state is a
 * soft tint.
 */
export function WaiterSidebar() {
  const t = useTranslations('waiter');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const session = useWaiterSession();

  const homeHref = `/${locale}/tables` as Route;
  const accountHref = `/${locale}/account` as Route;
  const isHome =
    pathname === homeHref ||
    pathname.startsWith(`/${locale}/orders`) ||
    pathname.startsWith(`/${locale}/menu`);
  const isAccount = pathname.startsWith(accountHref) || pathname.startsWith(`/${locale}/shift`);

  const initial = (session?.name?.trim()?.charAt(0) ?? 'O').toUpperCase();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore — we clear the local session and leave regardless.
    }
    clearWaiterSession();
    // Portal has basePath '/panel/portal'. window.location is a raw browser
    // nav so we must include the prefix manually; otherwise the proxy
    // routes `/uz/login` to the marketing fallback (404).
    window.location.href = `/panel/portal/${locale}/login`;
  };

  return (
    <aside
      className="hidden lg:flex lg:min-h-screen lg:w-60 lg:flex-shrink-0 lg:flex-col border-r border-hairline-soft bg-canvas"
      aria-label="Primary"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-[18px]">
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-ink text-canvas">
          <Storefront className="h-4 w-4" weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption-strong text-ink">{session?.tenantName ?? 'MyPOS'}</p>
          <p className="truncate text-fine-print text-ink-muted-48">{t('brand.role')}</p>
        </div>
      </div>

      {/* Primary action — mirrors the mobile FAB, adapted to a pill button */}
      <Link
        href={`/${locale}/new-order` as Route}
        className="mx-3.5 mb-3.5 flex items-center justify-center gap-1.5 rounded-pill bg-tenant py-2.5 text-caption-strong text-tenant-on-primary transition-transform active:scale-95"
      >
        <Plus className="h-[15px] w-[15px]" weight="bold" />
        {t('nav.newOrder')}
      </Link>

      {/* Navigation — two real destinations */}
      <nav className="flex-1 space-y-0.5 px-2.5">
        <Link
          href={homeHref}
          aria-current={isHome ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-caption-strong transition-colors',
            isHome
              ? 'bg-tenant-tint text-tenant'
              : 'text-ink-muted-80 hover:bg-parchment hover:text-ink',
          )}
        >
          <House className="h-[18px] w-[18px] flex-shrink-0" weight={isHome ? 'fill' : 'regular'} />
          {t('nav.home')}
        </Link>
        <Link
          href={accountHref}
          aria-current={isAccount ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-caption-strong transition-colors',
            isAccount
              ? 'bg-tenant-tint text-tenant'
              : 'text-ink-muted-80 hover:bg-parchment hover:text-ink',
          )}
        >
          <UserCircle
            className="h-[18px] w-[18px] flex-shrink-0"
            weight={isAccount ? 'fill' : 'regular'}
          />
          {t('nav.account')}
        </Link>
      </nav>

      {/* Profile + sign out */}
      <div className="space-y-1 border-t border-hairline-soft p-2.5">
        {session ? (
          <Link
            href={accountHref}
            className="mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-parchment"
          >
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-coral-tint text-caption-strong font-semibold text-coral">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <p className="truncate text-caption-strong text-ink">{session.name}</p>
              <p className="truncate text-fine-print text-ink-muted-48">{t('brand.role')}</p>
            </span>
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-caption-strong text-ink-muted-80 transition-colors hover:bg-error-soft hover:text-error-text"
        >
          <SignOut className="h-[18px] w-[18px]" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
