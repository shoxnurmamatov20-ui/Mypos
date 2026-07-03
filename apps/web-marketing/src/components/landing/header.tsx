'use client';

import { ArrowRight, List, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

/**
 * Floating glassmorphism header — flat, essential links only.
 */
export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}/features`, label: t('features') },
    { href: `/${locale}/pricing`, label: t('pricing') },
    { href: `/${locale}/solutions`, label: t('solutions') },
    { href: `/${locale}/customers`, label: t('customers') },
    { href: `/${locale}/about`, label: t('about') },
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-3 sm:top-4 z-40 px-3 sm:px-5">
      <div className="dark">
        <div className="nav-glass-light relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 rounded-full px-4 sm:px-5">
          <Link href={`/${locale}`} className="shrink-0 pl-1.5">
            <Logo />
          </Link>

          {/* Desktop nav — absolutely centered */}
          <nav
            aria-label="Primary"
            className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-1.5 lg:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full text-[13.5px] font-semibold text-white/75 hover:text-white transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <a
              href={`/panel/portal/${locale}/login`}
              className="px-2.5 py-1.5 rounded-full text-[12.5px] font-semibold text-white/75 hover:text-white transition-colors whitespace-nowrap"
            >
              {t('login')}
            </a>
            <Link
              href={`/${locale}/get-started`}
              className="press inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-white text-[#001B1B] text-[13px] font-bold shadow-[0_4px_14px_-4px_rgba(0,0,0,0.30)] hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              {t('demo_cta')}
              <ArrowRight size={12} weight="bold" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('close_menu') : t('open_menu')}
            aria-expanded={open}
            className="press flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/[0.08] lg:hidden"
          >
            {open ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer + backdrop */}
      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-20 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          />
          <div className="dark">
            <div className="nav-glass-light fixed top-20 inset-x-3 sm:inset-x-5 z-50 rounded-2xl ring-1 ring-inset ring-white/10 lg:hidden">
              <nav aria-label="Mobile" className="flex flex-col px-3 py-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-[14px] font-semibold text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center gap-2">
                  <LanguageSwitcher align="left" />
                  <ThemeToggle />
                  <Link
                    href={`/${locale}/get-started`}
                    onClick={() => setOpen(false)}
                    className="press flex-1 h-9 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-[0_8px_22px_-6px_rgba(255,0,55,0.5)]"
                  >
                    {t('demo_cta')}
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
