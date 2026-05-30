'use client';

import { ChefHat, LogOut, Menu, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { KITCHEN_NAV } from '@/lib/nav';
import { useKitchenSession } from '@/lib/session';
import { ThemeToggle } from './theme-toggle';

/**
 * Kitchen rail — the web-superadmin sidebar pattern, scoped to the
 * line. `bg-white dark:bg-gray-900` column with a teal-tinted active
 * state, items split into **Oshxona** and **Tizim** section groups.
 * The same `sidebarContent` is shared between the desktop column and
 * the mobile drawer so the two surfaces never drift apart.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useKitchenSession();
  const [open, setOpen] = useState(false);

  const displayName = user.name || user.email;
  const initial = (user.name?.trim()?.charAt(0) ?? user.email.charAt(0) ?? 'K').toUpperCase();
  const role = user.roles[0] ?? 'kitchen';
  const tenantName = user.tenant?.name ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[rgba(15,118,110,0.18)] dark:ring-[rgba(20,184,166,0.25)] bg-gradient-to-br from-[#0f766e] to-[#14b8a6] flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">MyPOS</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 truncate">
            {tenantName ? `Oshxona · ${tenantName}` : 'Oshxona'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white -m-1 p-1"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {KITCHEN_NAV.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-3')}>
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href as Route}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[rgba(15,118,110,0.09)] text-[#0f766e] dark:bg-[rgba(20,184,166,0.13)] dark:text-[#14b8a6]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive && 'text-[#0f766e] dark:text-[#14b8a6]',
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + Sign out */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0f766e] to-[#14b8a6] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate uppercase tracking-wide">
              {role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0f766e] to-[#14b8a6] flex items-center justify-center flex-shrink-0 ring-1 ring-[rgba(15,118,110,0.18)] dark:ring-[rgba(20,184,166,0.25)]">
            <ChefHat className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            MyPOS Kitchen
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Backdrop */}
      {open ? (
        <button
          type="button"
          aria-label="Menyuni yopish"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        />
      ) : null}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:w-64 lg:flex-col lg:min-h-screen lg:border-r lg:border-gray-200 dark:lg:border-gray-800 bg-white dark:bg-gray-900"
        aria-label="Asosiy navigatsiya"
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
