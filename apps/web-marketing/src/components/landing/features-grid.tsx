'use client';

import {
  Brain,
  ChartLineUp,
  CookingPot,
  type Icon,
  QrCode,
  Storefront,
  TelegramLogo,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

type FeatureKey = 'pos' | 'kds' | 'qr_menu' | 'analytics' | 'ai' | 'telegram';

const ICONS: Record<FeatureKey, Icon> = {
  pos: Storefront,
  kds: CookingPot,
  qr_menu: QrCode,
  analytics: ChartLineUp,
  ai: Brain,
  telegram: TelegramLogo,
};

const ORDER: FeatureKey[] = ['pos', 'kds', 'qr_menu', 'analytics', 'ai', 'telegram'];

export function FeaturesGrid() {
  const t = useTranslations('features');

  return (
    <section id="features" className="soft-checker bg-[#F7FAF7]">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="grid gap-md lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <span className="font-display text-tagline text-coral">{t('section_label')}</span>
            <h2 className="mt-sm max-w-2xl font-display text-display-lg font-semibold text-ink">
              {t('title')}
            </h2>
          </div>
          <p className="max-w-2xl font-display text-lead text-ink-muted-80 lg:justify-self-end">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup as="ul" className="mt-xxl grid gap-md lg:grid-cols-6">
          {ORDER.map((key, index) => {
            const Icon = ICONS[key];
            const featured = index === 0 || index === 1;
            return (
              <StaggerItem
                as="li"
                key={key}
                className={[
                  'group relative overflow-hidden rounded-card border border-black/[0.06] bg-white p-lg shadow-[0_20px_60px_rgba(16,18,17,0.07)] transition-transform duration-fast active:scale-95',
                  featured ? 'lg:col-span-3' : 'lg:col-span-2',
                ].join(' ')}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-coral via-[#F6B15F] to-[#50D1AA]"
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-md">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-[#101211] text-coral-on-dark"
                    aria-hidden="true"
                  >
                    <Icon size={26} weight="light" />
                  </div>
                  <span className="rounded-pill bg-coral-tint px-xs py-xxs text-fine-print font-semibold text-coral">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-md font-display text-title font-semibold text-ink">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-xs text-body text-ink-muted-80">{t(`items.${key}.desc`)}</p>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
