import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('not_found_page');
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-[#0f766e]">404</p>
      <h1 className="mt-6 font-display text-2xl font-bold text-[#16221f] dark:text-white">
        {t('title')}
      </h1>
      <p className="mt-3 text-[#62716d] dark:text-[#94a3b8]">{t('subtitle')}</p>
      <Link
        href={`/${locale}/overview` as Route}
        className="mt-8 inline-flex items-center rounded-xl bg-[#0f766e] px-6 py-3 font-bold text-white transition hover:bg-[#115e59] active:scale-95"
      >
        {t('back_home')}
      </Link>
    </div>
  );
}
