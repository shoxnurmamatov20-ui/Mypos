'use client';

import { Check } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { TOTAL_WIZARD_STEPS, useWizardStore, type WizardStep } from '@/lib/wizard-store';

export function WizardProgress() {
  const t = useTranslations('onboarding.steps');
  const step = useWizardStore((s) => s.step);
  const setStep = useWizardStore((s) => s.setStep);

  const labels: Array<{ n: WizardStep; key: string }> = [
    { n: 1, key: 'restaurant' },
    { n: 2, key: 'menu' },
    { n: 3, key: 'tables' },
    { n: 4, key: 'payments' },
    { n: 5, key: 'tier' },
  ];

  return (
    <nav aria-label={t('aria_label')} className="w-full">
      <ol className="flex items-center justify-between gap-xs sm:gap-sm">
        {labels.map(({ n, key }) => {
          const completed = n < step;
          const active = n === step;
          const clickable = n < step;

          return (
            <li key={n} className="flex flex-1 items-center gap-xs sm:gap-sm">
              <button
                type="button"
                disabled={!clickable && !active}
                onClick={() => clickable && setStep(n)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${t('step')} ${n}: ${t(key)}`}
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 font-display font-semibold text-caption transition-transform duration-fast',
                  completed
                    ? 'border-success bg-success text-white active:scale-95'
                    : active
                      ? 'border-coral bg-coral text-white shadow-product'
                      : 'border-hairline-soft bg-canvas text-ink-muted-48',
                  clickable ? 'cursor-pointer active:scale-95' : 'cursor-default',
                ].join(' ')}
              >
                {completed ? (
                  <Check size={16} weight="bold" aria-hidden="true" />
                ) : (
                  <span>{n}</span>
                )}
              </button>

              <span
                className={[
                  'hidden text-caption font-semibold sm:inline',
                  active ? 'text-coral' : completed ? 'text-success-text' : 'text-ink-muted-48',
                ].join(' ')}
              >
                {t(key)}
              </span>

              {n < TOTAL_WIZARD_STEPS && (
                <span
                  aria-hidden="true"
                  className={[
                    'h-0.5 flex-1 rounded-pill transition-colors duration-base',
                    completed ? 'bg-success' : 'bg-parchment',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
