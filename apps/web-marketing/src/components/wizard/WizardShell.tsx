'use client';

import { useTranslations } from 'next-intl';
import { useWizardStore } from '@/lib/wizard-store';
import { Step1Restaurant } from './Step1Restaurant';
import { Step2Menu } from './Step2Menu';
import { Step3Tables } from './Step3Tables';
import { Step4Payment } from './Step4Payment';
import { Step5Tier } from './Step5Tier';
import { WizardProgress } from './WizardProgress';

export function WizardShell() {
  const t = useTranslations('onboarding');
  const step = useWizardStore((s) => s.step);

  return (
    <div className="mx-auto max-w-4xl px-md">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display font-semibold text-display-sm text-ink tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-xs text-caption text-ink-muted-80">{t('subtitle')}</p>
      </div>

      <div className="mb-md mt-xl">
        <WizardProgress />
      </div>

      {step === 1 && <Step1Restaurant />}
      {step === 2 && <Step2Menu />}
      {step === 3 && <Step3Tables />}
      {step === 4 && <Step4Payment />}
      {step === 5 && <Step5Tier />}
    </div>
  );
}
