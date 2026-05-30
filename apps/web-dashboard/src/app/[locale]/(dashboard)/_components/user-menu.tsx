'use client';

import type { AuthUser } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase() || 'U';
}

function getPrimaryRole(user: AuthUser): string {
  if (user.is_super_admin) return 'super_admin';
  return user.roles[0] ?? 'user';
}

export interface UserMenuProps {
  user: AuthUser;
  locale: string;
}

export function UserMenu({ user, locale }: UserMenuProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    } else {
      router.replace(`/${locale}/login`);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 text-sm font-medium text-[#16221f] dark:text-white hover:border-[rgba(22,34,31,0.09)] dark:hover:border-[rgba(255,255,255,0.07)] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-[11px] font-semibold text-white">
          {getInitials(user.name)}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-[12px] font-semibold text-[#16221f] dark:text-white leading-tight">{user.name}</span>
          <span className="block text-[10px] text-[#62716d] dark:text-[#94a3b8] uppercase tracking-wide">{getPrimaryRole(user)}</span>
        </span>
        <ChevronDown className="h-3 w-3 text-[#62716d] dark:text-[#94a3b8]" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] bg-white shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#0f172a] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <div className="border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] p-4">
            <p className="text-sm font-semibold text-[#16221f] dark:text-white">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-[#62716d] dark:text-[#94a3b8]">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:text-teal-300"
                >
                  {role}
                </span>
              ))}
              {user.is_super_admin && (
                <span className="rounded-full bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">
                  super_admin
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push(`/${locale}/profile`);
            }}
            className={cn(
              'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
            )}
          >
            <User className="h-4 w-4" aria-hidden />
            <span>{t('profile')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>{t('logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
