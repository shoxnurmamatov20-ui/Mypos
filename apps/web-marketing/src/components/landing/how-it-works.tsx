import { ArrowRight, ClipboardList, Rocket, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STEPS: { key: 'one' | 'two' | 'three'; icon: LucideIcon }[] = [
  { key: 'one', icon: UserPlus },
  { key: 'two', icon: ClipboardList },
  { key: 'three', icon: Rocket },
];

export function HowItWorks() {
  const t = useTranslations('how');

  return (
    <section className="bg-gradient-to-b from-white to-brand-50/40 py-20 sm:py-28">
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

        <ol className="mt-14 grid items-stretch gap-6 md:grid-cols-3 md:gap-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;
            return (
              <li
                key={step.key}
                className="relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-display font-bold text-white">
                    {idx + 1}
                  </span>
                  <Icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {t(`steps.${step.key}.label`)}
                </div>
                <h3 className="mt-1 font-display text-xl font-semibold text-neutral-900">
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {t(`steps.${step.key}.desc`)}
                </p>

                {!isLast ? (
                  <div
                    className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block"
                    aria-hidden="true"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-500 shadow-sm">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
