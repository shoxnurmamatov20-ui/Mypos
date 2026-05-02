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

/**
 * Apple-style logo marquee — parchment band, hairline borders top + bottom,
 * 14px caption-strong label, monochrome wordmarks.
 */
export function CustomerLogos() {
  const t = useTranslations('customer_logos');

  return (
    <section className="bg-canvas border-y border-hairline-soft py-xxl">
      <div className="mx-auto max-w-7xl px-md sm:px-lg lg:px-xl">
        <p className="text-center text-caption-strong text-ink-muted-48 font-display">
          {t('label')}
        </p>

        <div className="relative mt-lg overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 z-10 w-24 bg-gradient-to-r from-canvas to-transparent" />
          <div className="absolute top-0 right-0 bottom-0 z-10 w-24 bg-gradient-to-l from-canvas to-transparent" />

          <motion.div
            animate={{ x: [0, '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex gap-xxl whitespace-nowrap"
          >
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: marquee duplicates LOGOS
                key={`${name}-${i}`}
                className="flex h-12 items-center gap-xs opacity-60 transition-opacity duration-base hover:opacity-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-pearl bg-parchment text-body-strong text-ink-muted-80 font-display">
                  {name[0]}
                </div>
                <span className="text-tagline text-ink font-display font-semibold">
                  {name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
