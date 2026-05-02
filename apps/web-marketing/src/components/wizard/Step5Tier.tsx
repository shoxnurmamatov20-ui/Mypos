'use client';

import { Check, Sparkle } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { OnboardingApiError, submitOnboarding } from '@/lib/wizard-api';
import { finalSubmissionSchema, TIER_KEYS, type TierKey } from '@/lib/wizard-schemas';
import { useWizardStore } from '@/lib/wizard-store';
import { WizardNavButtons } from './WizardNavButtons';

const TIER_FEATURE_COUNT: Record<TierKey, number> = {
  free: 4,
  pro: 5,
  plus: 6,
  enterprise: 6,
};

export function Step5Tier() {
  const t = useTranslations('onboarding.step5');
  const tErr = useTranslations('onboarding.errors');
  const locale = useLocale();

  const state = useWizardStore();
  const setTier = useWizardStore((s) => s.setTier);
  const setSubmitting = useWizardStore((s) => s.setSubmitting);
  const setError = useWizardStore((s) => s.setError);
  const setRegistrationId = useWizardStore((s) => s.setRegistrationId);
  const prev = useWizardStore((s) => s.prev);

  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    setLocalError(null);
    setError(null);

    const payload = {
      restaurant: state.restaurant,
      menu: state.menu,
      tables: state.tables,
      payments: state.payments,
      tier: state.tier,
      registration_id: state.submission.registrationId ?? undefined,
    };

    const parsed = finalSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setLocalError('validation_failed');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitOnboarding(parsed.data, locale);
      setRegistrationId(result.tenant_id);
      const target =
        result.payment_redirect_url ?? result.admin_login_url ?? 'https://app.mypos.uz/login';
      window.location.assign(target);
    } catch (e) {
      const message = e instanceof OnboardingApiError ? `api_${e.status}` : 'submit_failed';
      setLocalError(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="step5-title"
      className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring sm:p-xl"
    >
      <h2
        id="step5-title"
        className="font-display font-semibold text-display-sm text-ink"
      >
        {t('title')}
      </h2>
      <p className="mt-xs text-caption text-ink-muted-80">{t('subtitle')}</p>

      <div className="mt-xl grid gap-sm lg:grid-cols-4">
        {TIER_KEYS.map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            selected={state.tier === tier}
            featureCount={TIER_FEATURE_COUNT[tier]}
            onSelect={() => setTier(tier)}
          />
        ))}
      </div>

      {localError && (
        <p role="alert" className="mt-md rounded-pearl bg-error-soft px-md py-xs text-caption text-error">
          {tErr(localError)}
        </p>
      )}

      <WizardNavButtons
        onPrev={prev}
        onNext={handleSubmit}
        loading={state.submission.submitting}
        nextLabelKey={state.tier === 'free' ? 'finish_free' : 'pay_and_finish'}
      />
    </section>
  );
}

function TierCard({
  tier,
  selected,
  featureCount,
  onSelect,
}: {
  tier: TierKey;
  selected: boolean;
  featureCount: number;
  onSelect: () => void;
}) {
  const t = useTranslations('onboarding.step5.tiers');
  const highlight = tier === 'pro';

  const stateClass = selected
    ? 'border-coral bg-coral-tint shadow-hairline-ring'
    : highlight
      ? 'border-hairline-soft bg-canvas hover:border-coral/50'
      : 'border-hairline-soft bg-canvas hover:border-hairline-soft/70';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative h-full cursor-pointer rounded-card border-2 p-lg text-left transition-transform duration-fast active:scale-95 ${stateClass}`}
    >
      {highlight && !selected && (
        <span className="-top-3 -translate-x-1/2 absolute left-1/2 inline-flex items-center gap-xxs rounded-pill bg-tenant px-sm py-xxs font-display font-semibold text-fine-print text-tenant-on-primary uppercase">
          <Sparkle size={12} weight="fill" aria-hidden="true" />
          {t('most_popular')}
        </span>
      )}

      <div className="font-display font-semibold text-title text-ink">{t(`${tier}.name`)}</div>
      <div className="mt-xxs text-fine-print text-ink-muted-80">{t(`${tier}.tagline`)}</div>

      <div className="mt-md">
        <div className="tabular font-display font-semibold text-display-sm text-ink tracking-tight">
          {t(`${tier}.price`)}
        </div>
        <div className="text-fine-print text-ink-muted-48">{t(`${tier}.price_note`)}</div>
      </div>

      <ul className="mt-md space-y-xxs text-caption text-ink-muted-80">
        {Array.from({ length: featureCount }).map((_, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: feature order is stable per tier
            key={i}
            className="flex items-start gap-xs"
          >
            <Check
              size={16}
              weight="bold"
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-success-text"
            />
            <span>{t(`${tier}.features.${i}`)}</span>
          </li>
        ))}
      </ul>

      {selected && (
        <span className="absolute top-md right-md inline-flex h-6 w-6 items-center justify-center rounded-pill bg-coral text-white">
          <Check size={16} weight="bold" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
