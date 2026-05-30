'use client';

import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore, type SuperAdminRole } from '@/stores/auth';

const ROLE_LABEL_KEY: Record<SuperAdminRole, string> = {
  owner: 'role_owner',
  admin: 'role_admin',
  support: 'role_support',
  finance: 'role_finance',
  developer: 'role_developer',
};

/**
 * User chip + dropdown — pill with a teal gradient avatar + role label,
 * opens a card with name/email/role badge + profile / settings / logout
 * actions. Cross-port logout still routes through `/portal/logout` so
 * cookies are cleared everywhere.
 */
export function UserMenu() {
  const t = useTranslations('user_menu');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!user) return null;

  const initial = (user.name?.trim()?.charAt(0) ?? user.email.charAt(0)).toUpperCase();
  const role: SuperAdminRole = user.super_admin_role ?? 'admin';
  const roleLabel = t(ROLE_LABEL_KEY[role]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    } else {
      router.replace(`/${locale}/login` as Route);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.name || user.email}
        className={cn(
          'flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border transition-colors duration-150',
          'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60',
          'hover:border-teal-500 dark:hover:border-teal-400',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        )}
      >
        <span
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-blue-700 text-white text-[11px] font-extrabold"
          aria-hidden="true"
        >
          {initial}
        </span>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 capitalize">
          {roleLabel}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-gray-500 dark:text-gray-400 transition-transform duration-150',
            open && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-full mt-1.5 w-64 origin-top-right rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 shadow-lg shadow-gray-900/10 dark:shadow-gray-900/40 z-50"
        >
          <div className="border-b border-gray-100 dark:border-gray-800 px-3 pb-3 pt-2">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {user.name || user.email}
            </p>
            <p className="mt-0.5 break-all text-[11px] text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-teal-50 dark:bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">
              {roleLabel}
            </span>
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5">
            <Link
              href={`/${locale}/settings` as Route}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800"
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('profile')}</span>
            </Link>
            <Link
              href={`/${locale}/settings` as Route}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('settings')}</span>
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 dark:text-red-400 transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus-visible:bg-red-50 dark:focus-visible:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
