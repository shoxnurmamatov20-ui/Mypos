'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[web-ceo global-error]', error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="bg-white text-[#16221f] antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="text-7xl font-extrabold text-[#0f766e]">!</p>
            <h2 className="mt-6 text-2xl font-bold text-[#16221f]">Something went wrong</h2>
            <p className="mt-3 break-words text-sm text-[#62716d]">
              {error.message || 'Unknown error'}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 inline-flex items-center rounded-xl bg-[#0f766e] px-8 py-3 font-bold text-white transition hover:bg-[#115e59]"
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
