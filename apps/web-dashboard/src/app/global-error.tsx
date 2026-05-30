'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Top-level error boundary — replaces the whole document when a render
 * error escapes the locale layout. It sits outside the i18n provider,
 * so copy is intentionally minimal and self-contained.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[web-dashboard global-error]', error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="bg-white text-[#16221f] antialiased dark:bg-[#0b1120] dark:text-[#e2e8f0]">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="text-[72px] font-black leading-none text-[#0f766e] dark:text-teal-400">
              !
            </p>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#16221f] dark:text-white">
              Xatolik yuz berdi
            </h2>
            <p className="mt-2 break-words text-sm text-[#62716d] dark:text-[#94a3b8]">
              {error.message || 'Unknown error'}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-7 inline-flex h-10 items-center rounded-md bg-[#0f766e] px-6 text-[13px] font-semibold text-white transition-colors hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
            >
              Qayta urinish
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
