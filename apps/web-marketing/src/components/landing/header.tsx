'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, List, X } from '@phosphor-icons/react';
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
    { href: `/${locale}/#solutions`, label: t('solutions') },
    { href: `/${locale}/pricing`, label: t('pricing') },
    { href: `/${locale}/customers`, label: t('customers') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/blog`, label: t('blog') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  return (
    <header className="frosted-nav sticky top-0 z-40 border-b border-black/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-md px-md sm:px-lg lg:px-xl">
        <Logo locale={locale} />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-xs rounded-pill border border-black/5 bg-white/70 px-xs py-xxs text-nav-link text-ink shadow-[0_10px_28px_rgba(16,18,17,0.06)] lg:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-pill px-sm py-xxs transition-colors duration-fast hover:bg-coral-tint hover:text-coral"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-xs lg:flex">
          <LanguageSwitcher />
          <Link
            href={`/${locale}/contact`}
            className="px-sm py-xs text-nav-link text-ink-muted-80 transition-colors duration-fast hover:text-coral"
          >
            {t('login')}
          </Link>
          <Link
            href={`/${locale}/get-started`}
            className="inline-flex h-10 items-center gap-xxs rounded-pill bg-tenant px-md text-caption-strong text-tenant-on-primary shadow-[0_10px_24px_rgba(234,124,105,0.28)] transition-transform duration-fast active:scale-95"
          >
            {t('demo_cta')}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t('close_menu') : t('open_menu')}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-card border border-black/5 bg-white/75 text-ink shadow-[0_8px_24px_rgba(16,18,17,0.08)] transition-transform duration-fast active:scale-95 lg:hidden"
        >
          {open ? (
            <X size={20} weight="bold" aria-hidden="true" />
          ) : (
            <List size={20} weight="bold" aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-black/5 bg-white/95 lg:hidden"
          >
            <motion.nav
              aria-label="Mobile primary"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
              }}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-xxs px-md pb-md pt-xs"
            >
              {links.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, x: -16 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-card px-sm py-xs text-body text-ink transition-colors duration-fast hover:bg-coral-tint hover:text-coral"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-sm flex items-center gap-xs"
              >
                <LanguageSwitcher align="left" />
                <Link
                  href={`/${locale}/contact`}
                  onClick={() => setOpen(false)}
                  className="ml-auto px-sm py-xs text-body text-ink transition-colors duration-fast hover:text-coral"
                >
                  {t('login')}
                </Link>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/${locale}/get-started`}
                  onClick={() => setOpen(false)}
                  className="mt-xs inline-flex h-12 w-full items-center justify-center rounded-pill bg-tenant px-md text-body text-tenant-on-primary transition-transform duration-fast active:scale-95"
                >
                  {t('demo_cta')}
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
