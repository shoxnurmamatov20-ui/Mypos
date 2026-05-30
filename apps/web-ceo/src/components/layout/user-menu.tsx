'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

/**
 * ShifoReyting-style `user-chip` — pill with 26×26 teal→blue gradient
 * avatar + role text, wrapped in a 1px-bordered surface2 capsule.
 * Clicking opens a small dropdown card with the name and logout.
 * Cross-port logout flow is handed to `/portal/logout`.
 */
export function UserMenu() {
  const t = useTranslations('user_menu');
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

  const initial = user.name.trim().charAt(0).toUpperCase() || 'C';

  const handleLogout = () => {
    setOpen(false);
    logout();
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border transition-colors',
          'border-[rgba(22,34,31,0.09)] bg-[#eef4f3] hover:border-[#0f766e]',
          'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:hover:border-[#14b8a6]',
        )}
      >
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#1d4ed8] text-white text-[11px] font-extrabold">
          {initial}
        </span>
        <span className="text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] capitalize">
          {user.name}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-[#62716d] dark:text-[#94a3b8] transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-60 origin-top-right rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-1.5 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-50"
        >
          <div className="border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-3 pb-3 pt-2">
            <p className="text-[13px] font-bold text-[#16221f] dark:text-white truncate">
              {user.name}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-[rgba(15,118,110,0.1)] dark:bg-[rgba(20,184,166,0.18)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f766e] dark:text-[#14b8a6]">
              {user.role}
            </span>
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-[7px] px-3 py-2 text-left text-[13px] font-medium text-[#b42318] dark:text-[#f87171] transition-colors hover:bg-[rgba(180,35,24,0.08)] dark:hover:bg-[rgba(239,68,68,0.12)]"
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
