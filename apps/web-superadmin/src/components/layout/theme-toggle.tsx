'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Theme toggle — single 30×30 surface chip with a 1px border. Shows
 * the *opposite* of the current theme as the glyph (Moon while light,
 * Sun while dark) so the icon doubles as a preview of what the click
 * will switch to.
 *
 * `resolvedTheme` is preferred over `theme` because the user may have
 * picked `system` previously — we still need a concrete light/dark
 * value to decide which glyph to render.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Hydration-safe stub — same dimensions as the real button.
    return (
      <div
        className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const label = isDark ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-[30px] w-[30px] items-center justify-center rounded-md border transition-colors duration-150',
        'border-gray-200 bg-gray-50 text-gray-500',
        'hover:border-teal-500 hover:text-teal-700',
        'dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400',
        'dark:hover:border-teal-400 dark:hover:text-teal-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
      )}
    >
      {isDark ? (
        <Sun className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Moon className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}
