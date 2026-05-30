'use client';

import { ArrowLeft, ChevronRight, LogOut } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { SectionHeader } from '@/components/profile/section-header';
import { routing } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth';

type LanguageOption = {
  code: 'uz' | 'ru' | 'en' | 'kz';
  flag: string;
  name: string;
};

const LANGUAGES: readonly LanguageOption[] = [
  { code: 'uz', flag: '🇺🇿', name: "O'zbekcha" },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'kz', flag: '🇰🇿', name: 'Қазақша' },
] as const;

export default function SettingsPage() {
  const t = useTranslations('settings_page');
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('profile_page');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const logout = useAuthStore((s) => s.logout);

  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifRecommendations, setNotifRecommendations] = useState(false);

  const handleLanguagePress = (code: LanguageOption['code']) => {
    if (code === locale) return;
    const segments = pathname.split('/');
    if (
      segments[1] &&
      routing.locales.includes(segments[1] as (typeof routing.locales)[number])
    ) {
      segments[1] = code;
    } else {
      segments.splice(1, 0, code);
    }
    const target = segments.join('/') || `/${code}`;
    startTransition(() => {
      router.push(target);
    });
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && !window.confirm(tProfile('logout_confirm'))) {
      return;
    }
    await logout();
    router.push(`/${locale}` as Route);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/${locale}/profile` as Route}
          aria-label={tCommon('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-neutral-900 sm:text-3xl">
          {t('title')}
        </h1>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        <section>
          <SectionHeader>{t('language')}</SectionHeader>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <ul className="divide-y divide-neutral-100">
              {LANGUAGES.map((lang) => {
                const isCurrent = locale === lang.code;
                return (
                  <li key={lang.code}>
                    <button
                      type="button"
                      onClick={() => handleLanguagePress(lang.code)}
                      aria-pressed={isCurrent}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-neutral-50"
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {lang.flag}
                      </span>
                      <span className="flex-1 text-base text-neutral-900">{lang.name}</span>
                      {isCurrent ? (
                        <span className="text-brand-500" aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section>
          <SectionHeader>{t('notifications')}</SectionHeader>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <ul className="divide-y divide-neutral-100">
              <ToggleRow
                label={t('notif_orders')}
                value={notifOrders}
                onChange={setNotifOrders}
              />
              <ToggleRow
                label={t('notif_promos')}
                value={notifPromos}
                onChange={setNotifPromos}
              />
              <ToggleRow
                label={t('notif_recommendations')}
                value={notifRecommendations}
                onChange={setNotifRecommendations}
              />
            </ul>
          </div>
        </section>

        <section>
          <SectionHeader>{t('account')}</SectionHeader>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 text-danger" aria-hidden="true" />
              <span className="flex-1 font-bold text-danger">{tProfile('logout')}</span>
              <ChevronRight className="h-5 w-5 text-danger/60" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <li className="flex items-center gap-3 px-5 py-4">
      <span className="flex-1 text-base text-neutral-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={
          value
            ? 'relative h-7 w-12 rounded-full bg-brand-500 transition'
            : 'relative h-7 w-12 rounded-full bg-neutral-200 transition'
        }
      >
        <span
          className={
            value
              ? 'absolute top-0.5 left-[22px] h-6 w-6 rounded-full bg-white shadow-sm transition'
              : 'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition'
          }
          aria-hidden="true"
        />
      </button>
    </li>
  );
}
