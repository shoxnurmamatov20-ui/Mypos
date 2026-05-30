'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

/**
 * Top-level client providers for the Kitchen panel. Order matters:
 *   1. `ThemeProvider` (next-themes) — flips `<html class="dark|light">`
 *      based on the user's choice. Reads/writes localStorage
 *      `mypos_kitchen_theme` so a refresh keeps the choice. `system`
 *      default means a fresh kitchen tablet follows the OS theme.
 *   2. `QueryClientProvider` — react-query cache for the order board /
 *      history fetches. Short `staleTime` keeps tickets fresh; the
 *      board itself drives the polling/Reverb refetch cadence.
 *
 * `attribute="class"` matches the `dark:` prefix used in Tailwind v4
 * (we declare `@custom-variant dark (&:where(.dark, .dark *))` in
 * globals.css).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="mypos_kitchen_theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
