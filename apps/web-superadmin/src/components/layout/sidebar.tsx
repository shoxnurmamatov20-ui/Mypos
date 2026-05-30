'use client';

import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

type NavItemId =
  | 'dashboard'
  | 'tenants'
  | 'billing'
  | 'audit'
  | 'admins'
  | 'settings';

type NavItem = {
  id: NavItemId;
  href: NavItemId;
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
      { id: 'dashboard', icon: LayoutDashboard, href: 'dashboard' },
      { id: 'tenants', icon: Building2, href: 'tenants' },
      { id: 'billing', icon: CreditCard, href: 'billing' },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { id: 'audit', icon: FileText, href: 'audit' },
      { id: 'admins', icon: UserCog, href: 'admins' },
      { id: 'settings', icon: Settings, href: 'settings' },
    ],
  },
];

/**
 * Primary sidebar — 256px on desktop with a fixed brand → nav → user
 * triptych. On mobile/tablet it collapses behind a hamburger and slides
 * in from the left over a dimmed backdrop. The same `sidebarContent`
 * is rendered in both surfaces so they never drift apart.
 *
 * Includes a skip-to-content link at the very top of the rail for
 * keyboard users; the main page region must carry `id="main"`.
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

  const initial = (user?.name?.trim()?.charAt(0) ?? user?.email?.charAt(0) ?? 'A').toUpperCase();
  const role = user?.super_admin_role ?? 'admin';

  // Close the mobile drawer on every route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC closes the mobile drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [open]);

  const handleLogout = async () => {
    await logout();
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    }
  };

  const sidebarContent = (
    <>
      {/* Skip link — first focusable element so keyboard users can jump past nav */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-teal-700 focus:text-white focus:text-sm focus:font-semibold"
      >
        Asosiy mazmunga o&apos;tish
      </a>

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div
          className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-100 dark:ring-teal-900/50 bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center"
          aria-hidden="true"
        >
          <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">
            MyPOS
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 truncate">
            Super Admin
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 -m-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label={tCommon('close')}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav
        aria-label="Primary"
        className="flex-1 px-3 py-3 overflow-y-auto"
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-3')}>
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ id, href, icon: Icon }) => {
                const fullHref = `/${locale}/${href}` as Route;
                const isActive =
                  href === 'dashboard'
                    ? pathname === fullHref
                    : pathname.startsWith(fullHref);
                return (
                  <Link
                    key={id}
                    href={fullHref}
                    prefetch
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                      isActive
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive && 'text-teal-700 dark:text-teal-400',
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                      aria-hidden="true"
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
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate uppercase tracking-wide font-bold">
                {role}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          {tCommon('logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — only visible below `lg` */}
      <header
        role="banner"
        className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 px-4 h-14"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5 -ml-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Menyu"
          aria-expanded={open}
          aria-controls="primary-nav"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center flex-shrink-0 ring-1 ring-teal-100 dark:ring-teal-900/50"
            aria-hidden="true"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            MyPOS Admin
          </p>
        </div>
        <NotificationBell />
        <ThemeToggle />
      </header>

      {/* Mobile backdrop */}
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={tCommon('close')}
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-200"
        />
      ) : null}

      {/* Desktop sidebar — fixed 256px column */}
      <aside
        id="primary-nav"
        aria-label="Primary"
        className="hidden lg:flex lg:w-64 lg:flex-col lg:min-h-screen lg:border-r lg:border-gray-200 dark:lg:border-gray-800 bg-white dark:bg-gray-900 shadow-sm shadow-gray-900/5"
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal={open}
        aria-label="Primary navigation"
        className={cn(
          'lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ease-out shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
