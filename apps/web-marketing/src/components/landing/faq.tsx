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

export function Faq() {
  const t = useTranslations('faq');
  const [openKey, setOpenKey] = useState<Key | null>('payments');

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {t('section_label')}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {KEYS.map((key) => {
            const open = openKey === key;
            return (
              <div
                key={key}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-brand-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : key)}
                  aria-expanded={open}
                  aria-controls={`faq-${key}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display text-base font-semibold text-neutral-900">
                    {t(`items.${key}.q`)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-neutral-500 transition-transform ${
                      open ? 'rotate-180 text-brand-600' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {open ? (
                  <div
                    id={`faq-${key}`}
                    className="border-t border-neutral-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-neutral-600"
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
