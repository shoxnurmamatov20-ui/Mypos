'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/** Single-button moon/sun toggle — ShifoReyting-style. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-8 w-8 rounded-md border border-[rgba(22,34,31,0.09)] bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235]"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title="Mavzu almashtirish"
      aria-label={isDark ? "Yorug' rejimga" : 'Tungi rejimga'}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(22,34,31,0.09)] bg-[#eef4f3] text-[#62716d] hover:border-[#0f766e] hover:text-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-[#94a3b8] dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6] transition-colors"
    >
      {isDark ? <Sun size={15} weight="bold" /> : <Moon size={15} weight="bold" />}
    </button>
  );
}
