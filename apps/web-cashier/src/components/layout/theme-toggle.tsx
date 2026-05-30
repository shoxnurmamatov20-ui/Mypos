'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Light / dark toggle — 32px chip matching the language switcher. Renders a
 * placeholder until mounted so the server/client markup stays identical.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const base = cn(
    'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
    'border-[rgba(22,34,31,0.09)] bg-[#eef4f3] text-[#16221f] hover:border-[#0f766e] hover:text-[#0f766e]',
    'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6]',
  );

  if (!mounted) {
    return <div className={base} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={base}
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
