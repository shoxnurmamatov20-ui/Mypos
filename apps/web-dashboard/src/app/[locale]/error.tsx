'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

/**
 * Locale-scoped error boundary — himoya/ShifoReyting styled. Catches
 * render/runtime errors inside the locale segment and offers a retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  useEffect(() => {
    console.error('[web-dashboard error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#16221f] dark:text-white">
        {tErrors('generic')}
      </h2>
      <p className="mt-2 max-w-md break-words text-sm text-[#62716d] dark:text-[#94a3b8]">
        {error.message || tCommon('error')}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-7 inline-flex h-10 items-center rounded-md bg-[#0f766e] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
      >
        {tCommon('retry')}
      </button>
    </div>
  );
}
