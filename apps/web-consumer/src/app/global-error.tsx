'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="bg-white text-neutral-900 antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <p className="text-9xl" aria-hidden="true">
              😬
            </p>
            <h2 className="mt-6 font-display text-3xl font-bold text-neutral-900">
              Xatolik yuz berdi
            </h2>
            <p className="mt-3 break-words text-sm text-neutral-500">
              {error.message || 'Unknown error'}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 inline-flex items-center rounded-2xl bg-brand-500 px-8 py-3 font-bold text-white transition hover:bg-brand-600"
            >
              Qayta urinish
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
