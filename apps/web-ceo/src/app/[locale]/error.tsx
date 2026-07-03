'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function LocaleErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  const tErr = useTranslations('errors');

  useEffect(() => {
    console.error('[web-ceo error]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-[#0f766e]" aria-hidden="true" />
      <h2 className="mt-4 font-display text-2xl font-bold text-[#16221f] dark:text-white">
        {tErr('generic')}
      </h2>
      <p className="mt-2 break-words text-sm text-[#62716d] dark:text-[#94a3b8]">
        {error.message || 'Unknown error'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#0f766e] px-6 text-sm font-bold text-white transition hover:bg-[#115e59] active:scale-95"
      >
        {t('retry')}
      </button>
    </div>
  );
}
