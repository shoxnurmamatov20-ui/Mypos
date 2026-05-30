'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  const tErr = useTranslations('errors');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-5xl">⚠️</p>
      <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900">
        {tErr('generic')}
      </h2>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
      >
        {t('retry')}
      </button>
    </div>
  );
}
