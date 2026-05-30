'use client';

import { motion } from 'framer-motion';
import { Apple, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * App download CTA. Real store URLs go behind these placeholders once the
 * native apps clear review.
 */
export function AppCta() {
  const t = useTranslations('home');

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700"
        >
          {/* Decorative blobs. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 right-10 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl"
          />

          <div className="relative grid gap-8 p-10 sm:p-12 lg:grid-cols-2 lg:p-16">
            {/* LEFT — copy + store badges. */}
            <div>
              <p className="font-bold uppercase tracking-wide text-white/70">{t('app_eyebrow')}</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {t('app_title')}
              </h2>
              <p className="mt-4 max-w-md text-base text-white/70">{t('app_subtitle')}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex h-14 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 text-white transition hover:bg-white/20"
                >
                  <Apple className="h-7 w-7" aria-hidden="true" />
                  <span className="text-left">
                    <span className="block text-[10px] uppercase tracking-wide text-white/70">
                      Download on the
                    </span>
                    <span className="block font-display text-base font-bold">App Store</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-14 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 text-white transition hover:bg-white/20"
                >
                  <Smartphone className="h-7 w-7" aria-hidden="true" />
                  <span className="text-left">
                    <span className="block text-[10px] uppercase tracking-wide text-white/70">
                      Get it on
                    </span>
                    <span className="block font-display text-base font-bold">Google Play</span>
                  </span>
                </button>
              </div>
            </div>

            {/* RIGHT — phone-ish mockup, decorative. */}
            <div className="relative hidden h-[360px] lg:block" aria-hidden="true">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-8 top-0 h-[360px] w-56 rounded-[2.5rem] border-8 border-neutral-700 bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between bg-brand-500 px-4 py-3 text-white">
                  <span className="text-xs font-bold">MyPOS</span>
                  <span className="text-[10px]">9:41</span>
                </div>
                <div className="space-y-2 p-3">
                  <div className="h-20 rounded-xl bg-amber-100" />
                  <div className="h-20 rounded-xl bg-red-100" />
                  <div className="h-20 rounded-xl bg-yellow-100" />
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute left-0 top-24 flex w-56 items-center gap-3 rounded-3xl bg-white p-4 shadow-2xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100 text-2xl">
                  🛵
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-neutral-900">5 daq</p>
                  <p className="text-xs text-neutral-500">Yetib keldi</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
