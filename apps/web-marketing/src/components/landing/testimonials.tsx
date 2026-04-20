import { Quote, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

const KEYS = ['one', 'two', 'three'] as const;

export function Testimonials() {
  const t = useTranslations('testimonials');

  return (
    <section className="bg-gradient-to-b from-brand-50/40 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {t('section_label')}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {KEYS.map((key) => (
            <li
              key={key}
              className="relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <Quote className="h-8 w-8 text-brand-200" aria-hidden="true" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-700">
                &ldquo;{t(`items.${key}.quote`)}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display font-bold text-white"
                  aria-hidden="true"
                >
                  {t(`items.${key}.author`).charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">{t(`items.${key}.author`)}</div>
                  <div className="text-xs text-neutral-500">{t(`items.${key}.role`)}</div>
                </div>
                <div className="flex text-gold-500" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
