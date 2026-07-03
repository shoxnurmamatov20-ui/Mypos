'use client';

import { Check, CreditCard, type Icon, Money, Wallet } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { PAYMENT_PROVIDERS, type PaymentProvider } from '@/lib/wizard-schemas';
import { useWizardStore } from '@/lib/wizard-store';
import { WizardNavButtons } from './WizardNavButtons';

const PROVIDER_ICONS: Record<PaymentProvider, Icon> = {
  cash: Money,
  click: Wallet,
  payme: Wallet,
  card: CreditCard,
};

export function Step4Payment() {
  const t = useTranslations('onboarding.step4');

  const payments = useWizardStore((s) => s.payments);
  const toggle = useWizardStore((s) => s.togglePaymentProvider);
  const next = useWizardStore((s) => s.next);
  const prev = useWizardStore((s) => s.prev);

  return (
    <section
      aria-labelledby="step4-title"
      className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring sm:p-xl"
    >
      <h2 id="step4-title" className="font-display font-semibold text-display-sm text-ink">
        {t('title')}
      </h2>
      <p className="mt-xs text-caption text-ink-muted-80">{t('subtitle')}</p>

      <div className="mt-xl grid gap-sm sm:grid-cols-2">
        {PAYMENT_PROVIDERS.map((provider) => {
          const selected = payments.providers.includes(provider);
          const Icon = PROVIDER_ICONS[provider];

          return (
            <button
              key={provider}
              type="button"
              onClick={() => toggle(provider)}
              aria-pressed={selected}
              className={[
                'flex items-start gap-md rounded-card border-2 p-lg text-left transition-transform duration-fast active:scale-95',
                selected
                  ? 'border-coral bg-coral-tint shadow-hairline-ring'
                  : 'border-hairline-soft bg-canvas hover:border-coral/40',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-pearl',
                  selected ? 'bg-coral text-white' : 'bg-parchment text-ink-muted-80',
                ].join(' ')}
              >
                <Icon size={24} weight="duotone" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-xs">
                  <span className="font-display font-semibold text-body-strong text-ink">
                    {t(`providers.${provider}.title`)}
                  </span>
                  {selected && (
                    <Check size={16} weight="bold" aria-label="selected" className="text-coral" />
                  )}
                </div>
                <div className="mt-xxs text-fine-print text-ink-muted-80">
                  {t(`providers.${provider}.description`)}
                </div>
                {provider !== 'cash' && (
                  <div className="mt-xs text-fine-print text-coral">
                    {t(`providers.${provider}.setup_note`)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-md rounded-pearl bg-parchment px-md py-xs text-caption text-ink-muted-80">
        {t('skip_hint')}
      </p>

      <WizardNavButtons onPrev={prev} onNext={next} />
    </section>
  );
}
