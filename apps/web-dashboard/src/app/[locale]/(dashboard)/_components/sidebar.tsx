'use client';

import { cn } from '@mypos/ui';
import { ChevronRight, Lock, LogOut, Menu as MenuIcon, ShieldCheck, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { LEAF_ICONS, NAV_GROUPS, type NavSection, SECTION_BY_ID, SECTIONS } from './nav-config';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

/**
 * Primary sidebar — 256px brand → nav → user triptych, matching the
 * super-admin rail class for class.
 *
 * The one structural difference is depth: super-admin has six flat links, the
 * manager panel has nine sections with sub-items, so the rows here expand into
 * an accordion. Row metrics, colours, group captions and states are otherwise
 * identical, including the teal-50 / teal-700 selected treatment.
 *
 * The nine-colour `SECTION_ICON_COLOR` map this file used to carry is gone —
 * super-admin glyphs are monochrome and only turn teal when their row is active.
 */
const ROW_BASE =
  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const ROW_ACTIVE = 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300';
const ROW_IDLE =
  'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white';

export function Sidebar() {
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const [open, setOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initial = (user?.name?.trim()?.charAt(0) ?? user?.email?.charAt(0) ?? 'M').toUpperCase();
  const role = user?.is_super_admin ? 'super_admin' : (user?.roles?.[0] ?? 'manager');

  const sectionWithActivePath = useMemo(() => {
    for (const s of SECTIONS) {
      if (!s.items) continue;
      if (s.items.some((it) => pathname.startsWith(`/${locale}/${it.href}`))) return s.id;
    }
    return null;
  }, [pathname, locale]);

  const [openSection, setOpenSection] = useState<string | null>(sectionWithActivePath);

  useEffect(() => {
    if (sectionWithActivePath) setOpenSection(sectionWithActivePath);
  }, [sectionWithActivePath]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? '/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    }
  };

  const renderSection = (section: NavSection) => {
    const label = t(section.id);
    const Icon = section.icon;

    if (!section.items) {
      const fullHref = `/${locale}/${section.href}` as Route;
      const isActive = pathname === fullHref;
      return (
        <Link
          key={section.id}
          href={fullHref}
          prefetch
          aria-current={isActive ? 'page' : undefined}
          className={cn(ROW_BASE, isActive ? ROW_ACTIVE : ROW_IDLE)}
        >
          <Icon
            className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-teal-700 dark:text-teal-400')}
            strokeWidth={isActive ? 2.5 : 2}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </Link>
      );
    }

    const items = section.items;
    const isOpen = openSection === section.id;
    const holdsActive = sectionWithActivePath === section.id;

    return (
      <div key={section.id}>
        <button
          type="button"
          onClick={() => setOpenSection(isOpen ? null : section.id)}
          aria-expanded={isOpen}
          className={cn(ROW_BASE, 'w-full', holdsActive ? ROW_ACTIVE : ROW_IDLE)}
        >
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              holdsActive && 'text-teal-700 dark:text-teal-400',
            )}
            strokeWidth={holdsActive ? 2.5 : 2}
            aria-hidden="true"
          />
          {/* `truncate` also sets nowrap — browsers otherwise break
              "Menyu-translyatsiya" at its hyphen onto a second line. */}
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-600',
              isOpen && 'rotate-90',
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-0.5 ml-[18px] space-y-0.5 border-l border-gray-100 pl-2 dark:border-gray-800">
              {items.map((it) => {
                const fullHref = `/${locale}/${it.href}` as Route;
                const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
                const ItemIcon = LEAF_ICONS[it.id];
                return (
                  <Link
                    key={it.id}
                    href={fullHref}
                    prefetch
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(ROW_BASE, 'py-2', isActive ? ROW_ACTIVE : ROW_IDLE)}
                  >
                    {ItemIcon ? (
                      <ItemIcon
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isActive && 'text-teal-700 dark:text-teal-400',
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{t(it.id)}</span>
                    {it.locked ? (
                      <Lock
                        className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-600"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-teal-700 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Asosiy mazmunga o&apos;tish
      </a>

      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 dark:border-gray-800">
        <div
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-600 to-teal-700 ring-2 ring-teal-100 dark:ring-teal-900/50"
          aria-hidden="true"
        >
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-tight font-semibold text-gray-900 dark:text-white">MyPOS</p>
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
            {user?.tenant?.name ?? 'Manager'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-m-1.5 rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 lg:hidden dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label={tCommon('close')}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.labelId ?? 'lead'} className={cn(gi > 0 && 'mt-3')}>
            {group.labelId ? (
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.08em] text-gray-400 uppercase dark:text-gray-500">
                {t(group.labelId)}
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.sectionIds.map((id) => {
                const section = SECTION_BY_ID.get(id);
                return section ? renderSection(section) : null;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + sign out */}
      <div className="space-y-1 border-t border-gray-100 p-3 dark:border-gray-800">
        {user ? (
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.name || user.email}
              </p>
              <p className="truncate text-[10px] font-bold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                {role}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:focus-visible:ring-offset-gray-900"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
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
        className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md lg:hidden dark:border-gray-800 dark:bg-gray-900/95"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1.5 rounded-md p-1.5 text-gray-700 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label={tCommon('menu')}
          aria-expanded={open}
          aria-controls="primary-nav"
        >
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700 ring-1 ring-teal-100 dark:ring-teal-900/50"
            aria-hidden="true"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">MyPOS</p>
        </div>
        <NotificationBell />
        <ThemeToggle />
      </header>

      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={tCommon('close')}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden"
        />
      ) : null}

      {/* Desktop rail — fixed 256px column */}
      <aside
        id="primary-nav"
        aria-label="Primary"
        className="hidden bg-white shadow-sm shadow-gray-900/5 lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 dark:bg-gray-900 dark:lg:border-gray-800"
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal={open}
        aria-label="Primary navigation"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-200 ease-out lg:hidden dark:border-gray-800 dark:bg-gray-900',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
