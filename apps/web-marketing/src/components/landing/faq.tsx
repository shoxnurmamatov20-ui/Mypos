'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const KEYS = [
  'payments',
  'offline',
  'hardware',
  'setup',
  'staff',
  'migration',
  'security',
  'support',
] as const;

type Key = (typeof KEYS)[number];

/**
 * Apple-style FAQ — parchment surface, hairline-divided rows,
 * chevron rotates 180 on open, body text 17px reading.
 */
export function Faq() {
  const t = useTranslations('faq');
  const [openKey, setOpenKey] = useState<Key | null>('payments');

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-3xl px-md py-section sm:px-lg lg:px-xl">
        <div className="text-center">
          <span className="text-tagline text-coral font-display">
            {t('section_label')}
          </span>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
        </div>

        <div className="mt-xxl divide-y divide-hairline-soft border-y border-hairline-soft">
          {KEYS.map((key) => {
            const open = openKey === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : key)}
                  aria-expanded={open}
                  aria-controls={`faq-${key}`}
                  className="flex w-full items-center justify-between gap-md py-md text-left transition-transform duration-fast active:scale-95"
                >
                  <span className="text-body-strong text-ink font-display">
                    {t(`items.${key}.q`)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-ink-muted-48 transition-transform duration-base ${
                      open ? 'rotate-180 text-coral' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {open ? (
                  <div
                    id={`faq-${key}`}
                    className="pb-md text-body text-ink-muted-80"
                  >
                    {t(`items.${key}.a`)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
