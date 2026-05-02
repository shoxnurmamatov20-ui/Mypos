'use client';

import { ArrowRight, Check } from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

type PlanKey = 'free' | 'starter' | 'pro' | 'business';

const PLANS: { key: PlanKey; highlight: boolean; featureCount: number }[] = [
  { key: 'free', highlight: false, featureCount: 4 },
  { key: 'starter', highlight: false, featureCount: 5 },
  { key: 'pro', highlight: true, featureCount: 5 },
  { key: 'business', highlight: false, featureCount: 5 },
];

export function PricingTable() {
  const t = useTranslations('pricing');
  const locale = useLocale();

  return (
    <section id="pricing" className="bg-[#F7FAF7]">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <span className="font-display text-tagline text-coral">{t('section_label')}</span>
          <h2 className="mt-sm font-display text-display-lg font-semibold text-ink">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-xl font-display text-lead text-ink-muted-80">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup className="mt-xxl grid gap-md lg:grid-cols-4">
          {PLANS.map((plan) => (
            <StaggerItem key={plan.key}>
              <PricingCard
                planKey={plan.key}
                highlight={plan.highlight}
                featureCount={plan.featureCount}
                locale={locale}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function PricingCard({
  planKey,
  highlight,
  featureCount,
  locale,
}: {
  planKey: PlanKey;
  highlight: boolean;
  featureCount: number;
  locale: string;
}) {
  const t = useTranslations('pricing');
  const name = t(`plans.${planKey}.name`);
  const tagline = t(`plans.${planKey}.tagline`);
  const priceUzs = t(`plans.${planKey}.price_uzs`);
  const priceUsd = t(`plans.${planKey}.price_usd`);

  const cardClass = highlight
    ? 'relative h-full rounded-card bg-[#101211] p-lg text-white shadow-[0_28px_80px_rgba(16,18,17,0.22)]'
    : 'relative h-full rounded-card border border-black/[0.06] bg-white p-lg shadow-[0_18px_50px_rgba(16,18,17,0.06)]';

  const ctaClass = highlight
    ? 'mt-lg inline-flex h-12 w-full items-center justify-center gap-xs rounded-pill bg-tenant px-lg text-body-strong text-tenant-on-primary transition-transform duration-fast active:scale-95'
    : 'mt-lg inline-flex h-12 w-full items-center justify-center gap-xs rounded-pill bg-[#101211] px-lg text-body-strong text-white transition-transform duration-fast active:scale-95';

  return (
    <div className={cardClass}>
      {highlight ? (
        <span className="mb-md inline-flex rounded-pill bg-coral px-sm py-xxs text-caption-strong text-white">
          {t('most_popular')}
        </span>
      ) : null}

      <div
        className={
          highlight
            ? 'font-display text-title font-semibold text-white'
            : 'font-display text-title font-semibold text-ink'
        }
      >
        {name}
      </div>
      <div
        className={
          highlight ? 'mt-xxs text-caption text-white/60' : 'mt-xxs text-caption text-ink-muted-80'
        }
      >
        {tagline}
      </div>

      <div className="mt-md">
        <div
          className={
            highlight
              ? 'tabular font-display text-display-md font-semibold text-white'
              : 'tabular font-display text-display-md font-semibold text-ink'
          }
        >
          {priceUzs}
        </div>
        <div
          className={
            highlight
              ? 'mt-xxs text-caption text-white/[0.48]'
              : 'mt-xxs text-caption text-ink-muted-48'
          }
        >
          {priceUsd}
          {planKey !== 'free' ? <span> {t('per_month')}</span> : null}
        </div>
      </div>

      <ul
        className={
          highlight
            ? 'mt-lg space-y-xs text-body text-white/[0.74]'
            : 'mt-lg space-y-xs text-body text-ink'
        }
      >
        {Array.from({ length: featureCount }).map((_, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: list order is stable by i18n
            key={i}
            className="flex items-start gap-xs"
          >
            <Check size={16} weight="bold" className="mt-1 flex-shrink-0 text-coral" aria-hidden="true" />
            <span>{t(`plans.${planKey}.features.${i}`)}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/${locale}/${planKey === 'business' ? 'contact' : 'get-started'}`}
        className={ctaClass}
      >
        {planKey === 'business' ? t('cta_contact') : t('cta')}
        <ArrowRight size={16} weight="bold" aria-hidden="true" />
      </Link>
    </div>
  );
}
