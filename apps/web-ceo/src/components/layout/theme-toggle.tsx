'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * ShifoReyting `theme-btn` — single 30×30 surface chip with a 1px
 * border. Shows the *opposite* of the current theme as the glyph
 * (Moon in light mode, Sun in dark mode), so the icon doubles as a
 * preview of what the click will switch to.
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
        className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[rgba(22,34,31,0.09)] bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235]"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title="Mavzu almashtirish"
      aria-label={isDark ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
      className={cn(
        'flex h-[30px] w-[30px] items-center justify-center rounded-md border transition-colors',
        'border-[rgba(22,34,31,0.09)] bg-[#eef4f3] text-[#62716d]',
        'hover:border-[#0f766e] hover:text-[#0f766e]',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-[#94a3b8]',
        'dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6]',
      )}
    >
      {isDark ? (
        <Sun className="h-[15px] w-[15px]" strokeWidth={2} />
      ) : (
        <Moon className="h-[15px] w-[15px]" strokeWidth={2} />
      )}
    </button>
  );
}
