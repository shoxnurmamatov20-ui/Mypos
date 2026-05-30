'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type StepKey = 'step1' | 'step2' | 'step3';

const STEPS: ReadonlyArray<{ key: StepKey; emoji: string }> = [
  { key: 'step1', emoji: '🍔' },
  { key: 'step2', emoji: '💳' },
  { key: 'step3', emoji: '🛵' },
] as const;

export function HowItWorks() {
  const t = useTranslations('home');

  return (
    <section className="bg-neutral-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            {t('how_it_works_title')}
          </h2>
          <p className="mt-3 text-base text-neutral-500">{t('how_subtitle')}</p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <motion.li
              key={step.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-100"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-display text-xl font-bold text-brand-600">
                {idx + 1}
              </div>
              <div className="mt-4 text-7xl" aria-hidden="true">
                {step.emoji}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-neutral-900">
                {t(`${step.key}_title`)}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">{t(`${step.key}_desc`)}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
