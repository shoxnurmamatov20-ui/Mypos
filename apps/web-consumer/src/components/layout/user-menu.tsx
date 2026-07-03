'use client';

import type { AuthUser } from '@mypos/api-client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ListOrdered, LogOut, User } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth';

type Props = {
  user: AuthUser;
  locale: string;
  labels: {
    profile: string;
    orders: string;
    logout: string;
  };
};

export function UserMenu({ user, locale, labels }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

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

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push(`/${locale}` as Route);
    router.refresh();
  };

  const firstName = user.name.split(' ')[0] ?? user.name;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-neutral-100 px-3 text-neutral-700 transition hover:bg-neutral-200"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {firstName.slice(0, 1).toUpperCase()}
        </span>
        <span className="text-sm font-semibold">{firstName}</span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl"
          >
            <div className="border-b border-neutral-100 px-3 pb-3 pt-2">
              <p className="text-sm font-bold text-neutral-900">{user.name}</p>
              {user.phone ? <p className="mt-0.5 text-xs text-neutral-500">{user.phone}</p> : null}
            </div>

            <div className="mt-2 flex flex-col gap-0.5">
              <Link
                href={`/${locale}/profile` as Route}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>{labels.profile}</span>
              </Link>
              <Link
                href={`/${locale}/orders` as Route}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <ListOrdered className="h-4 w-4" aria-hidden="true" />
                <span>{labels.orders}</span>
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{labels.logout}</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
