'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { type ReactNode, useState } from 'react';

/**
 * Top-level client providers. Order matters:
 *   1. `ThemeProvider` (next-themes) — flips `<html class="dark|light">`
 *      based on user choice (Yorug' / Tungi / Tizim). Reads/writes
 *      localStorage `mypos_admin_theme` so a refresh keeps the choice.
 *   2. `QueryClientProvider` — react-query cache for the dashboard /
 *      tenants / billing fetches.
 *
 * `attribute="class"` matches the `dark:` prefix used in Tailwind v4
 * (we declare `@custom-variant dark (&:where(.dark, .dark *))` in
 * globals.css).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="mypos_admin_theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
