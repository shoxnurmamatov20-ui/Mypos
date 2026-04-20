import { Check } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

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
    <section id="pricing" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {t('section_label')}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">{t('subtitle')}</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.key}
              planKey={plan.key}
              highlight={plan.highlight}
              featureCount={plan.featureCount}
              locale={locale}
            />
          ))}
        </div>
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
    ? 'relative rounded-2xl border-2 border-brand-500 bg-gradient-to-b from-white to-brand-50/40 p-6 shadow-xl shadow-brand-500/10'
    : 'relative rounded-2xl border border-neutral-200 bg-white p-6';
  const ctaClass = highlight
    ? 'mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600'
    : 'mt-6 inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:border-brand-300 hover:text-brand-700';

  return (
    <div className={cardClass}>
      {highlight ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
          {t('most_popular')}
        </span>
      ) : null}

      <div className="font-display text-xl font-bold text-neutral-900">{name}</div>
      <div className="mt-1 text-sm text-neutral-600">{tagline}</div>

      <div className="mt-5">
        <div className="font-display text-3xl font-extrabold tracking-tight text-neutral-900">
          {priceUzs}
        </div>
        <div className="mt-1 text-sm text-neutral-500">
          {priceUsd}
          {planKey !== 'free' ? <span className="text-neutral-400"> {t('per_month')}</span> : null}
        </div>
      </div>

      <ul className="mt-6 space-y-2.5 text-sm text-neutral-700">
        {Array.from({ length: featureCount }).map((_, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: list order is stable by i18n
            key={i}
            className="flex items-start gap-2"
          >
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint-600" aria-hidden="true" />
            <span>{t(`plans.${planKey}.features.${i}`)}</span>
          </li>
        ))}
      </ul>

      <Link href={`/${locale}/contact`} className={ctaClass}>
        {planKey === 'business' ? t('cta_contact') : t('cta')}
      </Link>
    </div>
  );
}
