'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

const KEYS = ['one', 'two', 'three'] as const;

/**
 * Apple-style testimonial tiles — canvas surface, 28px lead-style quote,
 * hairline-ring cards, monogram avatar circle, gold star row.
 */
export function Testimonials() {
  const t = useTranslations('testimonials');

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <span className="text-tagline text-coral font-display">{t('section_label')}</span>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
        </FadeUp>

        <StaggerGroup as="ul" className="mt-xxl grid gap-md md:grid-cols-3">
          {KEYS.map((key) => (
            <StaggerItem
              as="li"
              key={key}
              className="flex flex-col rounded-card bg-canvas p-lg shadow-hairline-ring"
            >
              <p className="flex-1 text-lead text-ink font-display">
                &ldquo;{t(`items.${key}.quote`)}&rdquo;
              </p>
              <div className="mt-lg flex items-center gap-sm border-t border-hairline-soft pt-md">
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-coral text-body-strong text-white font-display"
                  aria-hidden="true"
                >
                  {t(`items.${key}.author`).charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-caption-strong text-ink font-display">
                    {t(`items.${key}.author`)}
                  </div>
                  <div className="text-fine-print text-ink-muted-48">
                    {t(`items.${key}.role`)}
                  </div>
                </div>
                <div className="flex text-coral" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
