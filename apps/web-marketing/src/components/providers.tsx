'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Theme provider for the marketing site. Mirrors the super-admin setup
 * — flips `<html class="dark|light">` based on user choice, persists
 * to localStorage so a refresh keeps the choice.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="mypos_marketing_theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
