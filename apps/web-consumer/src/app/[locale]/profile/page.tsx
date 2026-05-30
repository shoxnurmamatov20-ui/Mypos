'use client';

import { formatUZS } from '@mypos/utils';
import { LogOut } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { MenuRowLink } from '@/components/profile/menu-row';
import { loadAllMockOrders } from '@/lib/save-order';
import { useAuthStore } from '@/stores/auth';

type DateLocale = 'uz' | 'ru' | 'en';
const SUPPORTED_LOCALES: readonly DateLocale[] = ['uz', 'ru', 'en'];

function isSupportedLocale(value: string): value is DateLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export default function ProfilePage() {
  const t = useTranslations('profile_page');
  const router = useRouter();
  const locale = useLocale();
  const localeKey: DateLocale = isSupportedLocale(locale) ? locale : 'uz';

  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const logout = useAuthStore((s) => s.logout);

  // Redirect unauthenticated users to /login once the auth store has hydrated.
  useEffect(() => {
    if (isBootstrapped && !user) {
      router.replace(`/${locale}/login` as Route);
    }
  }, [isBootstrapped, user, router, locale]);

  const stats = useMemo(() => {
    if (typeof window === 'undefined') {
      return { count: 0, totalSpent: 0 };
    }
    const orders = loadAllMockOrders();
    const totalSpent = orders.reduce((sum, o) => sum + o.amounts.total, 0);
    return { count: orders.length, totalSpent };
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && !window.confirm(t('logout_confirm'))) {
      return;
    }
    await logout();
    router.push(`/${locale}` as Route);
    router.refresh();
  };

  if (!isBootstrapped) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-7xl">👤</p>
        <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">
          {t('not_logged_in_title')}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">{t('not_logged_in_hint')}</p>
        <Link
          href={`/${locale}/login` as Route}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          {t('go_login')}
        </Link>
      </div>
    );
  }

  const userName = user.name;
  const userContact = user.email || user.phone || '';
  const initial = userName.charAt(0).toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
        {t('title')}
      </h1>

      <section className="mt-6 flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-500">
          <span className="text-2xl font-bold text-white">{initial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold text-neutral-900">{userName}</p>
          {userContact ? (
            <p className="truncate text-sm text-neutral-500">{userContact}</p>
          ) : null}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label={t('stat_orders')} value={String(stats.count)} />
        <StatCard label={t('stat_spent')} value={formatUZS(stats.totalSpent, localeKey)} />
        <StatCard label={t('stat_tier')} value="🥉" />
      </section>

      <nav
        aria-label={t('title')}
        className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white"
      >
        <ul className="divide-y divide-neutral-100">
          <li>
            <MenuRowLink emoji="📦" label={t('menu_orders')} href={`/${locale}/orders` as Route} />
          </li>
          <li>
            <MenuRowLink
              emoji="📍"
              label={t('menu_addresses')}
              href={`/${locale}/profile/addresses` as Route}
            />
          </li>
          <li>
            <PaymentsRow label={t('menu_payments')} />
          </li>
          <li>
            <MenuRowLink
              emoji="🎁"
              label={t('menu_loyalty')}
              href={`/${locale}/profile/loyalty` as Route}
            />
          </li>
          <li>
            <MenuRowLink
              emoji="⚙️"
              label={t('menu_settings')}
              href={`/${locale}/profile/settings` as Route}
            />
          </li>
          <li>
            <MenuRowLink
              emoji="❓"
              label={t('menu_help')}
              href={`/${locale}/profile/help` as Route}
            />
          </li>
        </ul>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 font-bold text-danger transition hover:bg-red-100"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        <span>{t('logout')}</span>
      </button>
    </div>
  );
}

type StatCardProps = { label: string; value: string };

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
      <p className="truncate text-base font-bold text-neutral-900 sm:text-lg">{value}</p>
      <p className="mt-1 truncate text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function PaymentsRow({ label }: { label: string }) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.alert('Tez orada');
    }
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
    >
      <span className="text-2xl" aria-hidden="true">
        💳
      </span>
      <span className="flex-1 font-semibold text-neutral-900">{label}</span>
      <span className="text-neutral-400" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
