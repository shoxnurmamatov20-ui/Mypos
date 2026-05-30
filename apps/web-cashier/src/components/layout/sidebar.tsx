'use client';

import {
  Clock,
  CreditCard,
  LogOut,
  type LucideIcon,
  Menu,
  ReceiptText,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type NavItemId = 'pos' | 'orders' | 'payments' | 'shift';

type NavItem = { id: NavItemId; icon: LucideIcon };
type NavGroup = { labelKey: 'group_work' | 'group_session'; items: readonly NavItem[] };

/**
 * Cashier-only navigation — four sections, nothing else. Splits into
 * "Ish" (POS / Orders / Payments) and "Smena" (Shift) so the rail stays
 * scannable on a busy register.
 */
const NAV_GROUPS: readonly NavGroup[] = [
  {
    labelKey: 'group_work',
    items: [
      { id: 'pos', icon: ShoppingCart },
      { id: 'orders', icon: ReceiptText },
      { id: 'payments', icon: CreditCard },
    ],
  },
  {
    labelKey: 'group_session',
    items: [{ id: 'shift', icon: Clock }],
  },
];

export function Sidebar() {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const [open, setOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initial = (user?.name?.trim()?.charAt(0) ?? 'K').toUpperCase();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/logout`;
    }
  };

  const content = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 dark:border-gray-800">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0c5f58] ring-2 ring-[#0f766e]/15">
          <Store className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
            {t('brand')}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{t('role')}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-m-1 p-1 text-gray-400 hover:text-gray-600 lg:hidden dark:hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.labelKey} className={cn(gi > 0 && 'mt-3')}>
            <div className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
              {t(group.labelKey)}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ id, icon: Icon }) => {
                const href = `/${locale}/${id}`;
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={id}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[#e6f3f1] text-[#0f766e] dark:bg-[#0f766e]/15 dark:text-[#5ed6c9]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive && 'text-[#0f766e] dark:text-[#5ed6c9]',
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {t(id)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + sign out */}
      <div className="space-y-1 border-t border-gray-100 p-3 dark:border-gray-800">
        {user ? (
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0c5f58] text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="truncate text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t('role')}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1.5 rounded-md p-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0c5f58]">
            <Store className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {t('brand')}
          </p>
        </div>
      </header>

      {/* Backdrop */}
      {open ? (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Desktop rail */}
      <aside
        className="hidden bg-white lg:flex lg:min-h-screen lg:w-60 lg:flex-col lg:border-r lg:border-gray-200 dark:bg-gray-900 dark:lg:border-gray-800"
        aria-label="Primary"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out lg:hidden dark:border-gray-800 dark:bg-gray-900',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {content}
      </aside>
    </>
  );
}
