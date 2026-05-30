import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('not_found_page');
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-6 font-display text-2xl font-bold text-neutral-100">{t('title')}</h1>
      <p className="mt-3 text-neutral-500">{t('subtitle')}</p>
      <Link
        href={`/${locale}/dashboard` as Route}
        className="mt-8 inline-flex items-center rounded-xl bg-brand-500 px-6 py-3 font-bold text-white transition hover:bg-brand-600"
      >
        {t('back_home')}
      </Link>
    </div>
  );
}
