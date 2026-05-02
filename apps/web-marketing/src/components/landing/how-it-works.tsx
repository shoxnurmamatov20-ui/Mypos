'use client';

import {
  CaretRight,
  type Icon,
  Lightning,
  SlidersHorizontal,
  UserPlus,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

const STEPS: { key: 'one' | 'two' | 'three'; icon: Icon }[] = [
  { key: 'one', icon: UserPlus },
  { key: 'two', icon: SlidersHorizontal },
  { key: 'three', icon: Lightning },
];

export function HowItWorks() {
  const t = useTranslations('how');

  return (
    <section className="bg-[#101211] text-white">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="grid gap-md lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="font-display text-tagline text-coral-on-dark">
              {t('section_label')}
            </span>
            <h2 className="mt-sm max-w-2xl font-display text-display-lg font-semibold text-white">
              {t('title')}
            </h2>
          </div>
          <p className="max-w-2xl font-display text-lead text-white/[0.64] lg:justify-self-end">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup as="ol" className="mt-xxl grid gap-md md:grid-cols-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;
            return (
              <StaggerItem
                as="li"
                key={step.key}
                className="relative overflow-hidden rounded-card border border-white/10 bg-white/[0.055] p-lg"
              >
                <div className="mb-lg flex items-center justify-between">
                  <span className="tabular font-display text-[56px] font-semibold leading-none text-white/[0.12]">
                    0{idx + 1}
                  </span>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-coral text-white">
                    <Icon size={26} weight="light" aria-hidden="true" />
                  </span>
                </div>
                <div className="font-display text-caption-strong text-coral-on-dark">
                  {t(`steps.${step.key}.label`)}
                </div>
                <h3 className="mt-xxs font-display text-title font-semibold text-white">
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-xs text-body text-white/[0.62]">{t(`steps.${step.key}.desc`)}</p>

                {!isLast ? (
                  <div
                    className="-right-4 absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-pill border border-white/10 bg-[#101211] text-coral-on-dark md:flex"
                    aria-hidden="true"
                  >
                    <CaretRight size={16} weight="bold" />
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
