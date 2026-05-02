'use client';

import { ArrowRight, Coffee, Sandwich, UtensilsCrossed, Wine } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

const SOLUTIONS = [
  { id: 'cafe', icon: Coffee, titleKey: 'cafe_title', descKey: 'cafe_desc', featuresKey: 'cafe_features' },
  { id: 'restaurant', icon: UtensilsCrossed, titleKey: 'restaurant_title', descKey: 'restaurant_desc', featuresKey: 'restaurant_features' },
  { id: 'fastfood', icon: Sandwich, titleKey: 'fastfood_title', descKey: 'fastfood_desc', featuresKey: 'fastfood_features' },
  { id: 'bar', icon: Wine, titleKey: 'bar_title', descKey: 'bar_desc', featuresKey: 'bar_features' },
] as const;

/**
 * Apple "Solutions for every kitchen" tile grid — parchment surface,
 * hairline-ring cards, single coral icon accent (no per-vertical color tints).
 */
export function SolutionsGrid() {
  const t = useTranslations('solutions');
  const locale = useLocale();

  return (
    <section id="solutions" className="bg-parchment">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto mb-xxl max-w-3xl text-center">
          <p className="text-tagline text-coral font-display">{t('label')}</p>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-xl text-lead text-ink font-display">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((solution) => {
            const Icon = solution.icon;
            const features = t.raw(solution.featuresKey) as string[];

            return (
              <StaggerItem key={solution.id}>
                <Link
                  href={`/${locale}/solutions/${solution.id}` as never}
                  className="group flex h-full flex-col rounded-card bg-canvas p-lg shadow-hairline-ring transition-transform duration-fast active:scale-95"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-pearl bg-pearl">
                    <Icon className="h-6 w-6 text-coral" aria-hidden="true" />
                  </div>

                  <h3 className="mt-md text-tagline text-ink font-display font-semibold">
                    {t(solution.titleKey)}
                  </h3>
                  <p className="mt-xs text-body text-ink-muted-80">
                    {t(solution.descKey)}
                  </p>

                  <ul className="mt-md space-y-xxs">
                    {features.slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-xs text-caption text-ink-muted-80"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-pill bg-coral-tint text-[10px] text-coral"
                        >
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-md inline-flex items-center gap-xxs text-caption-strong text-coral font-display">
                    {t('learn_more')}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
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
