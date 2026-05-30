'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="font-display text-7xl font-extrabold text-brand-500">!</p>
            <h2 className="mt-6 font-display text-2xl font-bold text-neutral-100">
              Something went wrong
            </h2>
            <p className="mt-3 break-words text-sm text-neutral-500">
              {error.message || 'Unknown error'}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 inline-flex items-center rounded-xl bg-brand-500 px-8 py-3 font-bold text-white transition hover:bg-brand-600"
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
