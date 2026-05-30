'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AlertOctagon,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

type NavItemId = 'overview' | 'restaurants' | 'finances' | 'clinics' | 'complaints';

type NavItem = {
  id: NavItemId;
  /** Relative path under the locale segment — may include nested segments. */
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  /** Tiny uppercase header rendered above the items in the group. */
  label: string;
  items: readonly NavItem[];
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Boshqaruv',
    items: [
      { id: 'overview', icon: LayoutDashboard, href: 'overview' },
      { id: 'restaurants', icon: Store, href: 'restaurants' },
      { id: 'clinics', icon: Stethoscope, href: 'dashboard/clinics' },
      { id: 'complaints', icon: AlertOctagon, href: 'dashboard/complaints' },
      { id: 'finances', icon: Wallet, href: 'finances' },
    ],
  },
];

/**
 * Himoya-pattern sidebar — `bg-white dark:bg-gray-900` rail with a
 * blue-tinted active state. Items are grouped under small uppercase
 * section headers. The same `sidebarContent` is shared between the
 * desktop column and the mobile drawer so the two surfaces never drift.
 */
export function Sidebar() {
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const [open, setOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initial = (user?.name?.trim()?.charAt(0) ?? 'C').toUpperCase();
  const role = user?.role ?? 'ceo';

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
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    }
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-900 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">MyPOS</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 truncate">CEO panel</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white -m-1 p-1"
          aria-label={tCommon('close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-3')}>
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ id, href, icon: Icon }) => {
                const fullHref = `/${locale}/${href}` as Route;
                const isActive =
                  href === 'overview'
                    ? pathname === fullHref
                    : pathname.startsWith(fullHref);
                return (
                  <Link
                    key={id}
                    href={fullHref}
                    prefetch
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive && 'text-blue-600 dark:text-blue-400',
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

      {/* Profile + Sign out */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
        {user ? (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate uppercase tracking-wide">
                {role}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {tCommon('logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 px-4 h-14">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5 -ml-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100 dark:ring-blue-900">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">MyPOS CEO</p>
        </div>
        <NotificationBell />
        <ThemeToggle />
      </header>

      {/* Backdrop */}
      {open ? (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        />
      ) : null}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:w-64 lg:flex-col lg:min-h-screen lg:border-r lg:border-gray-200 dark:lg:border-gray-800 bg-white dark:bg-gray-900"
        aria-label="Primary"
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
