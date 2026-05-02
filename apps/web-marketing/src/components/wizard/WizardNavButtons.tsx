'use client';

import { ArrowLeft, ArrowRight, CircleNotch } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

type Props = {
  onPrev?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  loading?: boolean;
  nextLabelKey?: string;
  hideBack?: boolean;
};

export function WizardNavButtons({
  onPrev,
  onNext,
  nextDisabled = false,
  loading = false,
  nextLabelKey = 'next',
  hideBack = false,
}: Props) {
  const t = useTranslations('onboarding.actions');

  return (
    <div className="mt-xl flex items-center justify-between gap-sm border-t border-hairline-soft pt-md">
      {hideBack ? (
        <span aria-hidden="true" className="flex-1" />
      ) : (
        <button
          type="button"
          onClick={onPrev}
          disabled={loading}
          className="inline-flex items-center gap-xxs rounded-pill border border-hairline-soft bg-canvas px-md py-xs font-display font-semibold text-caption-strong text-ink transition-transform duration-fast active:scale-95 disabled:opacity-50"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          {t('back')}
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="inline-flex items-center gap-xxs rounded-pill bg-tenant px-lg py-xs font-display font-semibold text-caption-strong text-tenant-on-primary transition-transform duration-fast active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        ) : (
          <>
            {t(nextLabelKey)}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
