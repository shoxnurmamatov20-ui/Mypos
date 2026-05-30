'use client';

import { Check, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/cn';

const LOCALES = [
  { code: 'uz', short: "O'zb", label: "O'zbekcha" },
  { code: 'ru', short: 'Рус', label: 'Русский' },
  { code: 'en', short: 'Eng', label: 'English' },
  { code: 'kz', short: 'Қаз', label: 'Қазақша' },
] as const;

/**
 * Language switcher — pill chip displaying the current locale's short
 * label (`O'zb` / `Рус` / `Eng` / `Қаз`) + chevron. Opens a dropdown
 * card with the full names and a check mark beside the active locale.
 * Chevron rotates 180° on open. Switching is wrapped in a `useTransition`
 * so the route swap doesn't block the input.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function switchTo(next: string) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    const segments = pathname.split('/');
    if (routing.locales.includes(segments[1] as (typeof routing.locales)[number])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    const target = segments.join('/') || `/${next}`;
    startTransition(() => {
      router.push(target);
      setOpen(false);
    });
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Til: ${current.label}`}
        className={cn(
          'flex h-8 items-center gap-1 rounded-md border px-2.5 transition-colors duration-150',
          'border-gray-200 bg-gray-50 text-gray-900 hover:border-teal-500 hover:text-teal-700',
          'dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:hover:border-teal-400 dark:hover:text-teal-400',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
          'text-xs font-semibold',
        )}
      >
        {current.short}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Til tanlash"
          className="absolute right-0 top-full mt-1.5 min-w-[160px] p-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg shadow-gray-900/10 dark:shadow-gray-900/40 z-50"
        >
          {LOCALES.map((l) => {
            const isActive = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="menuitem"
                onClick={() => switchTo(l.code)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-150 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800',
                  isActive
                    ? 'text-teal-700 dark:text-teal-400 font-semibold bg-teal-50/60 dark:bg-teal-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                )}
              >
                <span className="font-semibold w-8">{l.short}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal flex-1 text-left">
                  {l.label}
                </span>
                {isActive ? (
                  <Check
                    className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
