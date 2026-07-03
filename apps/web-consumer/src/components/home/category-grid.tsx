'use client';

import { motion } from 'framer-motion';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { type CategoryId, CUISINE_CATEGORIES } from '@/data/restaurants';

/**
 * Visual style per cuisine. Tailwind classes are listed literally so the
 * Tailwind 4 (Oxide) JIT scanner picks them up — never derive via concat.
 */
const CATEGORY_STYLE: Record<CategoryId, { bg: string; text: string }> = {
  all: { bg: 'bg-neutral-100 hover:bg-neutral-200', text: 'text-neutral-800' },
  uzbek: { bg: 'bg-amber-100 hover:bg-amber-200', text: 'text-amber-900' },
  fast_food: { bg: 'bg-yellow-100 hover:bg-yellow-200', text: 'text-yellow-900' },
  pizza: { bg: 'bg-red-100 hover:bg-red-200', text: 'text-red-900' },
  sushi: { bg: 'bg-pink-100 hover:bg-pink-200', text: 'text-pink-900' },
  cafe: { bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-900' },
  bakery: { bg: 'bg-purple-100 hover:bg-purple-200', text: 'text-purple-900' },
  asian: { bg: 'bg-emerald-100 hover:bg-emerald-200', text: 'text-emerald-900' },
  european: { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-900' },
};

export function CategoryGrid() {
  const t = useTranslations('home');
  const locale = useLocale() as 'uz' | 'ru' | 'en';
  const allHref = `/${locale}/search` as Route;

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold text-neutral-900 lg:text-4xl">
            {t('categories_title')}
          </h2>
          <Link
            href={allHref}
            className="hidden text-sm font-bold text-brand-500 transition hover:text-brand-600 md:inline-block"
          >
            {t('see_all')} →
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
          {CUISINE_CATEGORIES.map((cat, idx) => {
            const style = CATEGORY_STYLE[cat.id];
            const href =
              cat.id === 'all'
                ? (`/${locale}/search` as Route)
                : (`/${locale}/search?cuisine=${cat.id}` as Route);
            return (
              <li key={cat.id}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <Link
                    href={href}
                    className={`group relative flex aspect-square flex-col items-center justify-center rounded-3xl px-2 transition active:scale-95 ${style.bg} hover:shadow-lg`}
                  >
                    <span
                      className="text-4xl transition group-hover:scale-110 sm:text-5xl"
                      aria-hidden="true"
                    >
                      {cat.emoji}
                    </span>
                    <span
                      className={`mt-2 line-clamp-1 text-center text-xs font-bold sm:text-sm ${style.text}`}
                    >
                      {cat.label[locale]}
                    </span>
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
