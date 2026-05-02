'use client';

import { ArrowRight, type LucideIcon, Settings2, UserPlus, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

const STEPS: { key: 'one' | 'two' | 'three'; icon: LucideIcon }[] = [
  { key: 'one', icon: UserPlus },
  { key: 'two', icon: Settings2 },
  { key: 'three', icon: Zap },
];

/**
 * Apple "Three steps" tile — parchment surface, numbered pearl badges,
 * hairline-ring cards, single coral accent on icon + step number.
 */
export function HowItWorks() {
  const t = useTranslations('how');

  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <span className="text-tagline text-coral font-display">{t('section_label')}</span>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-xl text-lead text-ink font-display">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup
          as="ol"
          className="mt-xxl grid items-stretch gap-md md:grid-cols-3"
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;
            return (
              <StaggerItem
                as="li"
                key={step.key}
                className="relative flex flex-col rounded-card bg-canvas p-lg shadow-hairline-ring"
              >
                <div className="flex items-center gap-xs">
                  <span className="tabular inline-flex h-10 w-10 items-center justify-center rounded-pill bg-coral text-body-strong text-white font-display">
                    {idx + 1}
                  </span>
                  <Icon className="h-6 w-6 text-coral" aria-hidden="true" />
                </div>
                <div className="mt-md text-caption-strong text-ink-muted-80 font-display">
                  {t(`steps.${step.key}.label`)}
                </div>
                <h3 className="mt-xxs text-tagline text-ink font-display font-semibold">
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-xs text-body text-ink-muted-80">
                  {t(`steps.${step.key}.desc`)}
                </p>

                {!isLast ? (
                  <div
                    className="-translate-y-1/2 absolute top-1/2 right-0 hidden translate-x-1/2 md:block"
                    aria-hidden="true"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-canvas text-coral shadow-hairline-ring">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                ) : null}
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
