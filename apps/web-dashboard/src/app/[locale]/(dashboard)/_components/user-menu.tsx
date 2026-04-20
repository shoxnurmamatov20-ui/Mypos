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
    router.replace(`/${locale}/login`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-sm font-medium text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">
          {getInitials(user.name)}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-sm font-medium text-neutral-900">{user.name}</span>
          <span className="block text-xs text-neutral-500">{getPrimaryRole(user)}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-neutral-500" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
        >
          <div className="border-b border-neutral-100 p-4">
            <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-neutral-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700"
                >
                  {role}
                </span>
              ))}
              {user.is_super_admin && (
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
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
              'flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50',
            )}
          >
            <User className="h-4 w-4" aria-hidden />
            <span>{t('profile')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>{t('logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
