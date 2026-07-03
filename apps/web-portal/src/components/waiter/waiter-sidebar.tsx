'use client';

import { cn } from '@mypos/ui';
import {
  ForkKnife,
  GridFour,
  type Icon,
  List,
  Receipt,
  SignOut,
  Storefront,
  Timer,
  X,
} from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { logout as apiLogout } from '@/lib/api';
import { clearWaiterSession, useWaiterSession } from '@/lib/waiter-session';

type NavId = 'tables' | 'orders' | 'menu' | 'shift';
type NavItem = { id: NavId; icon: Icon };
type NavGroup = { label: 'groupWork' | 'groupShift'; items: readonly NavItem[] };

const NAV: readonly NavGroup[] = [
  {
    label: 'groupWork',
    items: [
      { id: 'tables', icon: GridFour },
      { id: 'orders', icon: Receipt },
      { id: 'menu', icon: ForkKnife },
    ],
  },
  {
    label: 'groupShift',
    items: [{ id: 'shift', icon: Timer }],
  },
];

/**
 * Waiter-panel sidebar — mirrors the `web-superadmin` rail (white column,
 * grouped nav with tiny uppercase headers) but trimmed to a waiter's four
 * screens and recoloured to the teal accent. The same `content` markup is
 * shared between the desktop column and the mobile drawer.
 */
export function WaiterSidebar() {
  const t = useTranslations('waiter');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const session = useWaiterSession();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const content = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-[rgba(22,34,31,0.08)] px-5 py-5">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#0d5e58] text-white">
          <Storefront className="h-5 w-5" weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-[#16221f]">
            {session?.tenantName ?? 'MyPOS'}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-[#62716d]">{t('brand.role')}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-m-1 p-1 text-[#62716d] hover:text-[#16221f] lg:hidden"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-3')}>
            <div className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9aa6a3]">
              {t(`nav.${group.label}`)}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ id, icon: Icon }) => {
                const href = `/${locale}/${id}` as Route;
                const isActive = id === 'tables' ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={id}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all',
                      isActive
                        ? 'bg-[#eef4f3] text-[#0f766e]'
                        : 'text-[#62716d] hover:bg-[#f4f6f6] hover:text-[#16221f]',
                    )}
                  >
                    <Icon
                      className="h-[18px] w-[18px] flex-shrink-0"
                      weight={isActive ? 'fill' : 'regular'}
                    />
                    {t(`nav.${id}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + sign out */}
      <div className="space-y-1 border-t border-[rgba(22,34,31,0.08)] p-3">
        {session ? (
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0d5e58] text-[13px] font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#16221f]">{session.name}</p>
              <p className="truncate text-[11px] uppercase tracking-wide text-[#9aa6a3]">
                {t('brand.role')}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-[#62716d] transition-colors hover:bg-[rgba(180,35,24,0.07)] hover:text-[#b42318]"
        >
          <SignOut className="h-[18px] w-[18px]" />
          {t('common.logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[rgba(22,34,31,0.09)] bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1.5 rounded-md p-1.5 text-[#16221f] hover:bg-[#f4f6f6]"
          aria-label={t('common.menu')}
        >
          <List className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#0f766e] to-[#0d5e58] text-white">
            <Storefront className="h-3.5 w-3.5" weight="fill" />
          </div>
          <p className="truncate text-[14px] font-semibold text-[#16221f]">{t('brand.role')}</p>
        </div>
      </header>

      {/* Backdrop */}
      {open ? (
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(22,34,31,0.45)] backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Desktop column */}
      <aside
        className="hidden border-r border-[rgba(22,34,31,0.09)] bg-white lg:flex lg:min-h-screen lg:w-60 lg:flex-col"
        aria-label="Primary"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[rgba(22,34,31,0.09)] bg-white transition-transform duration-200 ease-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {content}
      </aside>
    </>
  );
}
