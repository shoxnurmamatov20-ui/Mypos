'use client';

import {
  BarChart3,
  ChefHat,
  type LucideIcon,
  MessageCircle,
  QrCode,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

type FeatureKey = 'pos' | 'kds' | 'qr_menu' | 'analytics' | 'ai' | 'telegram';

const ICONS: Record<FeatureKey, LucideIcon> = {
  pos: ShoppingBag,
  kds: ChefHat,
  qr_menu: QrCode,
  analytics: BarChart3,
  ai: Sparkles,
  telegram: MessageCircle,
};

const ORDER: FeatureKey[] = ['pos', 'kds', 'qr_menu', 'analytics', 'ai', 'telegram'];

/**
 * Apple feature tile grid — parchment surface, hairline cards, single coral accent.
 * No gradients, no per-feature color tints (Apple discipline: single voltage only).
 */
export function FeaturesGrid() {
  const t = useTranslations('features');

  return (
    <section id="features" className="bg-parchment">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <span className="text-tagline text-coral font-display">
            {t('section_label')}
          </span>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-xl text-lead text-ink font-display">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup as="ul" className="mt-xxl grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          {ORDER.map((key) => {
            const Icon = ICONS[key];
            return (
              <StaggerItem
                as="li"
                key={key}
                className="group rounded-card bg-canvas p-lg shadow-hairline-ring transition-transform duration-fast active:scale-95"
              >
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-pearl bg-pearl"
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6 text-coral" />
                </div>
                <h3 className="mt-md text-tagline text-ink font-display font-semibold">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-xs text-body text-ink-muted-80">
                  {t(`items.${key}.desc`)}
                </p>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
