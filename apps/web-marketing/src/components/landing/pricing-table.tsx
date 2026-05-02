'use client';

import { Check } from 'lucide-react';
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

/**
 * Apple plan-card row — canvas background, hairline cards, single highlight.
 * The highlighted plan gets a coral hairline ring + "most popular" pill above.
 */
export function PricingTable() {
  const t = useTranslations('pricing');
  const locale = useLocale();

  return (
    <section id="pricing" className="bg-canvas">
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
    ? 'relative h-full rounded-card bg-canvas p-lg'
    : 'relative h-full rounded-card bg-canvas p-lg';
  const cardStyle = highlight
    ? { boxShadow: 'inset 0 0 0 2px #EA7C69' }
    : { boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.04)' };

  const ctaClass = highlight
    ? 'mt-lg inline-flex h-12 w-full items-center justify-center rounded-pill bg-tenant text-body text-tenant-on-primary transition-transform duration-fast active:scale-95'
    : 'mt-lg inline-flex h-12 w-full items-center justify-center rounded-pill bg-pearl text-body text-ink transition-transform duration-fast active:scale-95';

  return (
    <div className={cardClass} style={cardStyle}>
      {highlight ? (
        <span className="-top-3 -translate-x-1/2 absolute left-1/2 rounded-pill bg-coral px-sm py-xxs text-caption-strong text-white">
          {t('most_popular')}
        </span>
      ) : null}

      <div className="text-tagline text-ink font-display font-semibold">{name}</div>
      <div className="mt-xxs text-caption text-ink-muted-80">{tagline}</div>

      <div className="mt-md">
        <div className="tabular text-display-md text-ink font-display font-semibold">
          {priceUzs}
        </div>
        <div className="mt-xxs text-caption text-ink-muted-48">
          {priceUsd}
          {planKey !== 'free' ? (
            <span className="text-ink-muted-48"> {t('per_month')}</span>
          ) : null}
        </div>
      </div>

      <ul className="mt-lg space-y-xs text-body text-ink">
        {Array.from({ length: featureCount }).map((_, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: list order is stable by i18n
            key={i}
            className="flex items-start gap-xs"
          >
            <Check className="mt-1 h-4 w-4 flex-shrink-0 text-coral" aria-hidden="true" />
            <span>{t(`plans.${planKey}.features.${i}`)}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/${locale}/${planKey === 'business' ? 'contact' : 'get-started'}`}
        className={ctaClass}
      >
        {planKey === 'business' ? t('cta_contact') : t('cta')}
      </Link>
    </div>
  );
}
