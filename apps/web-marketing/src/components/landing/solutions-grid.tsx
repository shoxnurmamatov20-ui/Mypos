'use client';

import { CaretRight, Coffee, ForkKnife, Hamburger, Wine } from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

const SOLUTIONS = [
  {
    id: 'cafe',
    icon: Coffee,
    titleKey: 'cafe_title',
    descKey: 'cafe_desc',
    featuresKey: 'cafe_features',
  },
  {
    id: 'restaurant',
    icon: ForkKnife,
    titleKey: 'restaurant_title',
    descKey: 'restaurant_desc',
    featuresKey: 'restaurant_features',
  },
  {
    id: 'fastfood',
    icon: Hamburger,
    titleKey: 'fastfood_title',
    descKey: 'fastfood_desc',
    featuresKey: 'fastfood_features',
  },
  {
    id: 'bar',
    icon: Wine,
    titleKey: 'bar_title',
    descKey: 'bar_desc',
    featuresKey: 'bar_features',
  },
] as const;

const ACCENTS = [
  'from-coral-tint to-white',
  'from-[#E6FAF2] to-white',
  'from-[#FFF4DE] to-white',
  'from-[#EEF1FF] to-white',
];

export function SolutionsGrid() {
  const t = useTranslations('solutions');
  const locale = useLocale();

  return (
    <section id="solutions" className="bg-white">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto mb-xxl max-w-3xl text-center">
          <p className="font-display text-tagline text-coral">{t('label')}</p>
          <h2 className="mt-sm font-display text-display-lg font-semibold text-ink">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-[36rem] font-display text-lead text-ink-muted-80">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((solution, index) => {
            const Icon = solution.icon;
            const features = t.raw(solution.featuresKey) as string[];

            return (
              <StaggerItem key={solution.id}>
                <Link
                  href={`/${locale}/solutions/${solution.id}` as never}
                  className={`group flex h-full flex-col overflow-hidden rounded-card border border-black/[0.06] bg-gradient-to-b ${ACCENTS[index]} p-lg shadow-[0_18px_50px_rgba(16,18,17,0.07)] transition-transform duration-fast active:scale-95`}
                >
                  <div className="mb-lg flex items-center justify-between">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-card bg-[#101211] text-coral-on-dark">
                      <Icon size={28} weight="light" aria-hidden="true" />
                    </div>
                    <CaretRight
                      size={20}
                      weight="bold"
                      aria-hidden="true"
                      className="text-ink-muted-48 transition-transform duration-fast group-hover:translate-x-1 group-hover:text-coral"
                    />
                  </div>

                  <h3 className="font-display text-title font-semibold text-ink">
                    {t(solution.titleKey)}
                  </h3>
                  <p className="mt-xs text-body text-ink-muted-80">{t(solution.descKey)}</p>

                  <ul className="mt-md space-y-xxs">
                    {features.slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-xs text-caption text-ink-muted-80"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-pill bg-[#101211] text-[10px] text-coral-on-dark"
                        >
                          +
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-md font-display text-caption-strong text-coral">
                    {t('learn_more')}
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
