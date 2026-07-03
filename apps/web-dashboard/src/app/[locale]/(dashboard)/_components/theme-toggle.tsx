'use client';

import { cn } from '@mypos/ui';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'dark';
  const isDark = current === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0f172a] text-[#16221f] dark:text-white hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] transition-colors',
        className,
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
