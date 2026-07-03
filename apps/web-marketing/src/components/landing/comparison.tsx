'use client';

import { Check, Minus, X } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { FadeUp } from './animations';

type Status = 'yes' | 'no' | 'partial';

type FeatureRow = {
  key: string;
  mypos: Status;
  alipos: Status;
  zimzim: Status;
};

const FEATURES: FeatureRow[] = [
  { key: 'pos', mypos: 'yes', alipos: 'yes', zimzim: 'yes' },
  { key: 'mobile_consumer', mypos: 'yes', alipos: 'no', zimzim: 'partial' },
  { key: 'qr_menu', mypos: 'yes', alipos: 'no', zimzim: 'partial' },
  { key: 'kiosk', mypos: 'yes', alipos: 'no', zimzim: 'no' },
  { key: 'kds', mypos: 'yes', alipos: 'no', zimzim: 'no' },
  { key: 'telegram_bot', mypos: 'yes', alipos: 'no', zimzim: 'no' },
  { key: 'click_payme', mypos: 'yes', alipos: 'partial', zimzim: 'yes' },
  { key: 'ai_analytics', mypos: 'yes', alipos: 'no', zimzim: 'no' },
  { key: 'multi_tenant', mypos: 'yes', alipos: 'no', zimzim: 'no' },
  { key: 'multilingual', mypos: 'yes', alipos: 'partial', zimzim: 'partial' },
  { key: 'ios_android', mypos: 'yes', alipos: 'no', zimzim: 'partial' },
  { key: 'cloud', mypos: 'yes', alipos: 'no', zimzim: 'no' },
  { key: 'realtime', mypos: 'yes', alipos: 'no', zimzim: 'no' },
];

function StatusIcon({ status }: { status: Status }) {
  if (status === 'yes') {
    return (
      <span
        aria-label="yes"
        className="inline-flex h-7 w-7 items-center justify-center rounded-pill bg-coral-tint text-coral"
      >
        <Check size={16} weight="bold" />
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span
        aria-label="partial"
        className="inline-flex h-7 w-7 items-center justify-center rounded-pill bg-parchment text-ink-muted-48"
      >
        <Minus size={16} weight="bold" />
      </span>
    );
  }
  return (
    <span
      aria-label="no"
      className="inline-flex h-7 w-7 items-center justify-center rounded-pill bg-parchment text-ink-muted-48"
    >
      <X size={16} weight="bold" />
    </span>
  );
}

/**
 * Apple-style comparison table — canvas surface, hairline rows,
 * MyPOS column gets coral tint, no gradients.
 */
export function Comparison() {
  const t = useTranslations('comparison');

  return (
    <section id="comparison" className="bg-parchment">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto mb-xxl max-w-3xl text-center">
          <p className="text-tagline text-coral font-display">{t('label')}</p>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-[36rem] text-lead text-ink font-display">
            {t('subtitle')}
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="overflow-x-auto rounded-card bg-canvas shadow-hairline-ring">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline-soft">
                  <th className="p-md text-left text-caption-strong text-ink-muted-80 font-display">
                    {t('feature_header')}
                  </th>
                  <th className="bg-coral-tint p-md">
                    <div className="flex flex-col items-center gap-xxs">
                      <span className="text-tagline text-coral font-display font-semibold">
                        MyPOS
                      </span>
                      <span className="rounded-pill bg-coral px-xs py-xxs text-fine-print text-white">
                        {t('recommended')}
                      </span>
                    </div>
                  </th>
                  <th className="p-md">
                    <span className="text-tagline text-ink font-display font-semibold">AliPOS</span>
                  </th>
                  <th className="p-md">
                    <span className="text-tagline text-ink font-display font-semibold">
                      Zim-Zim
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature) => (
                  <tr key={feature.key} className="border-b border-hairline-soft last:border-0">
                    <td className="p-sm text-body text-ink">{t(`features.${feature.key}`)}</td>
                    <td className="bg-coral-tint p-sm">
                      <div className="flex justify-center">
                        <StatusIcon status={feature.mypos} />
                      </div>
                    </td>
                    <td className="p-sm">
                      <div className="flex justify-center">
                        <StatusIcon status={feature.alipos} />
                      </div>
                    </td>
                    <td className="p-sm">
                      <div className="flex justify-center">
                        <StatusIcon status={feature.zimzim} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>

        <FadeUp
          delay={0.3}
          className="mt-lg flex flex-wrap items-center justify-center gap-md text-caption text-ink-muted-80"
        >
          <div className="flex items-center gap-xs">
            <StatusIcon status="yes" />
            <span>{t('legend_yes')}</span>
          </div>
          <div className="flex items-center gap-xs">
            <StatusIcon status="partial" />
            <span>{t('legend_partial')}</span>
          </div>
          <div className="flex items-center gap-xs">
            <StatusIcon status="no" />
            <span>{t('legend_no')}</span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
