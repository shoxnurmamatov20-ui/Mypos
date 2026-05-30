'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  const tErr = useTranslations('errors');

  useEffect(() => {
    console.error('[super-admin error]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-brand-500" aria-hidden="true" />
      <h2 className="mt-4 font-display text-2xl font-bold text-neutral-100">{tErr('generic')}</h2>
      <p className="mt-2 break-words text-sm text-neutral-500">
        {error.message || 'Unknown error'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
      >
        {t('retry')}
      </button>
    </div>
  );
}
