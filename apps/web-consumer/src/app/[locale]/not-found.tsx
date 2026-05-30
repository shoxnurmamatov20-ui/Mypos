import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('not_found_page');
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-9xl opacity-30" aria-hidden="true">
        🍽️
      </p>
      <h1 className="mt-6 font-display text-3xl font-bold text-neutral-900">
        404 — {t('title')}
      </h1>
      <p className="mt-3 text-neutral-500">{t('subtitle')}</p>
      <Link
        href={`/${locale}` as Route}
        className="mt-8 inline-flex items-center rounded-2xl bg-brand-500 px-8 py-4 font-bold text-white transition hover:bg-brand-600"
      >
        ← {t('back_home')}
      </Link>
    </div>
  );
}
