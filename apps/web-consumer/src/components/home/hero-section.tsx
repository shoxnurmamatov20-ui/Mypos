'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

/**
 * Landing hero. Mesh background + animated headline + search CTA.
 * Floating cards on the right are decorative — real catalogue lives in
 * the FeaturedRestaurants / NearYou sections below.
 */
export function HeroSection() {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    const target = trimmed
      ? (`/${locale}/search?q=${encodeURIComponent(trimmed)}` as Route)
      : (`/${locale}/search` as Route);
    router.push(target);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/40 via-white to-white pb-16 pt-12 lg:pb-24 lg:pt-20">
      {/* Mesh blobs (decorative). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-mint-200/40 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT — copy + search */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-500" />
              </span>
              <span className="text-xs font-semibold text-neutral-700">{t('hero_badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 lg:text-7xl"
            >
              {t('hero_title_1')}{' '}
              <span className="block bg-gradient-to-r from-brand-500 via-brand-600 to-purple-500 bg-clip-text text-transparent">
                {t('hero_title_2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-neutral-600 lg:text-xl"
            >
              {t('hero_subtitle')}
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              onSubmit={onSubmit}
              className="mt-8 flex h-16 w-full max-w-xl items-stretch overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
              role="search"
            >
              <div className="flex shrink-0 items-center pl-5 pr-3 text-neutral-400">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('hero_search_placeholder')}
                aria-label={t('hero_search_placeholder')}
                className="flex-1 bg-transparent pr-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                className="hidden bg-brand-500 px-8 text-sm font-bold text-white transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:block"
              >
                {t('hero_search_button')}
              </button>
              <button
                type="submit"
                aria-label={t('hero_search_button')}
                className="flex w-14 items-center justify-center bg-brand-500 text-white transition hover:bg-brand-600 sm:hidden"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600"
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-mint-600" aria-hidden="true">
                  ✓
                </span>
                {t('trust_free_delivery')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-mint-600" aria-hidden="true">
                  ✓
                </span>
                {t('trust_support')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-mint-600" aria-hidden="true">
                  ✓
                </span>
                {t('trust_payments')}
              </span>
            </motion.div>
          </div>

          {/* RIGHT — floating cards (lg+ only). Decorative; not data-bound. */}
          <div className="relative hidden h-[420px] lg:block" aria-hidden="true">
            <FloatingCard
              emoji="🍕"
              name="Pizza House"
              meta="⭐ 4.6 · 30 daq"
              accent="bg-red-100"
              delay={0}
              className="absolute right-12 top-0 rotate-2"
            />
            <FloatingCard
              emoji="🍚"
              name="Osh Markazi"
              meta="⭐ 4.8 · 25 daq"
              accent="bg-amber-100"
              delay={0.4}
              className="absolute left-0 top-32 -rotate-3"
            />
            <FloatingCard
              emoji="🍔"
              name="Burger Master"
              meta="⭐ 4.4 · 20 daq"
              accent="bg-yellow-100"
              delay={0.8}
              className="absolute right-0 top-64 rotate-1"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

type FloatingCardProps = {
  emoji: string;
  name: string;
  meta: string;
  accent: string;
  className?: string;
  delay?: number;
};

function FloatingCard({ emoji, name, meta, accent, className, delay = 0 }: FloatingCardProps) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`flex w-64 items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-2xl ${
        className ?? ''
      }`}
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
        <span className="text-3xl">{emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold text-neutral-900">{name}</p>
        <p className="truncate text-xs text-neutral-500">{meta}</p>
      </div>
    </motion.div>
  );
}
