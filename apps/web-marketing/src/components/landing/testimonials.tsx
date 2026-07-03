'use client';

import { Quotes, Star } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

const KEYS = ['one', 'two', 'three'] as const;

/** Stats + 3 testimonial cards on the surface-tier teal section. */
export function Testimonials() {
  const t = useTranslations('testimonials');

  return (
    <section className="bg-[#001B1B] py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
            {t('section_label')}
          </p>
          <h2 className="mt-3 text-[28px] sm:text-[40px] font-extrabold leading-tight tracking-tight text-white">
            {t('title')}
          </h2>
        </div>

        {/* Stats */}
        <div className="glass-card mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-px rounded-2xl overflow-hidden">
          {[
            { value: '500+', label: t('stat_restaurants') },
            { value: '98%', label: t('stat_satisfaction') },
            { value: '40+', label: t('stat_brands') },
          ].map((s) => (
            <div key={s.label} className="px-4 py-6 text-center bg-white/[0.02]">
              <div className="tabular text-[28px] sm:text-[32px] font-extrabold leading-none text-white">
                {s.value}
              </div>
              <div className="mt-1.5 text-[12px] font-semibold text-white/60">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quote cards */}
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {KEYS.map((key) => (
            <li key={key} className="glass-card relative rounded-2xl p-6">
              <Quotes
                size={28}
                weight="fill"
                className="absolute right-5 top-5 text-[#14b8a6]/25"
                aria-hidden="true"
              />
              <div className="flex gap-0.5" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} weight="fill" className="text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-white/90">
                &ldquo;{t(`items.${key}.quote`)}&rdquo;
              </p>
              <div className="mt-5 border-t border-white/[0.08] pt-4">
                <p className="text-[14px] font-bold text-white">{t(`items.${key}.author`)}</p>
                <p className="mt-0.5 text-[12.5px] text-white/60">{t(`items.${key}.role`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
