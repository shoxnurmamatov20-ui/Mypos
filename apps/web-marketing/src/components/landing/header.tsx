'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}/features`, label: t('features') },
    { href: `/${locale}/pricing`, label: t('pricing') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/blog`, label: t('blog') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo locale={locale} />

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-neutral-700 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <Link
            href={`/${locale}/contact`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:text-brand-700"
          >
            {t('login')}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            {t('try_free')}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t('close_menu') : t('open_menu')}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 lg:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Mobile primary" className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2">
            <LanguageSwitcher align="left" />
            <Link
              href={`/${locale}/contact`}
              onClick={() => setOpen(false)}
              className="ml-auto rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              {t('try_free')}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
