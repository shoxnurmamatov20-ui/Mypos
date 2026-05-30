'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import type { AuthUser } from '@mypos/api-client';

type Props = {
  open: boolean;
  onClose: () => void;
  locale: string;
  user: AuthUser | null;
  labels: {
    menu: string;
    home: string;
    restaurants: string;
    orders: string;
    profile: string;
    login: string;
  };
};

export function HeaderMobileMenu({ open, onClose, locale, user, labels }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            aria-label={labels.menu}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <span className="font-display font-bold text-neutral-900">{labels.menu}</span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              <Link
                href={`/${locale}` as Route}
                onClick={onClose}
                className="block rounded-xl px-4 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {labels.home}
              </Link>
              <Link
                href={`/${locale}/restaurants` as Route}
                onClick={onClose}
                className="block rounded-xl px-4 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {labels.restaurants}
              </Link>
              <Link
                href={`/${locale}/orders` as Route}
                onClick={onClose}
                className="block rounded-xl px-4 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {labels.orders}
              </Link>
              {user ? (
                <Link
                  href={`/${locale}/profile` as Route}
                  onClick={onClose}
                  className="block rounded-xl px-4 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {labels.profile}
                </Link>
              ) : (
                <Link
                  href={`/${locale}/login` as Route}
                  onClick={onClose}
                  className="mt-2 block rounded-xl bg-brand-500 px-4 py-3 text-center font-bold text-white transition hover:bg-brand-600"
                >
                  {labels.login}
                </Link>
              )}
            </nav>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
