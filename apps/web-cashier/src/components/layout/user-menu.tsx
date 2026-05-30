'use client';

import { LogOut } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

/** Avatar chip + dropdown: name, role, sign-out (routes through the portal). */
export function UserMenu() {
  const t = useTranslations('user_menu');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/logout`;
    }
  };

  const initial = (user?.name?.trim()?.charAt(0) ?? 'K').toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 items-center gap-2 rounded-md border border-[rgba(22,34,31,0.09)] bg-[#eef4f3] pl-1 pr-2.5 transition-colors hover:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:hover:border-[#14b8a6]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0c5f58] text-[11px] font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate text-[12px] font-semibold text-[#16221f] sm:inline dark:text-white">
          {user?.name ?? 'Kassir'}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-[10px] border border-[rgba(22,34,31,0.09)] bg-white p-1 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-[#16221f] dark:text-white">
              {user?.name ?? 'Kassir'}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#62716d] dark:text-[#94a3b8]">
              {t('role_cashier')}
              {user?.tenant_name ? ` · ${user.tenant_name}` : ''}
            </p>
          </div>
          <div className="my-1 h-px bg-[rgba(22,34,31,0.06)] dark:bg-[rgba(255,255,255,0.06)]" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-2 rounded-[7px] px-3 py-2 text-[13px] font-medium transition-colors',
              'text-[#62716d] hover:bg-red-50 hover:text-red-600',
              'dark:text-[#94a3b8] dark:hover:bg-red-950/30 dark:hover:text-red-400',
            )}
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
