'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const LOGOS = [
  'Osh Markazi',
  'Pizza House',
  'Burger Master',
  'Tokyo Sushi',
  'Cafe Aroma',
  'Lavash House',
  'Asia Noodles',
  'Sweet Bakery',
  'Choyxona Imperial',
  'Plov Center',
  'Steak House',
  'Cafe Saodat',
];

export function CustomerLogos() {
  const t = useTranslations('customer_logos');

  return (
    <section className="border-y border-black/[0.06] bg-white py-xl">
      <div className="mx-auto max-w-7xl px-md sm:px-lg lg:px-xl">
        <p className="text-center font-display text-caption-strong text-ink-muted-48">
          {t('label')}
        </p>

        <div className="relative mt-lg overflow-hidden">
          <div className="absolute bottom-0 left-0 top-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute bottom-0 right-0 top-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

          <motion.div
            animate={{ x: [0, '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex gap-md whitespace-nowrap"
          >
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: marquee duplicates LOGOS
                key={`${name}-${i}`}
                className="flex h-14 items-center gap-xs rounded-pill border border-black/[0.06] bg-[#F7FAF7] px-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#101211] font-display text-caption-strong text-coral-on-dark">
                  {name[0]}
                </div>
                <span className="font-display text-caption-strong text-ink">{name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
