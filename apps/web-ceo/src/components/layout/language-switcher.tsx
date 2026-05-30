'use client';

import { ChevronDown } from 'lucide-react';
import type { Route } from 'next';
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
 * ShifoReyting-style `lang-drop` — 32px chip displaying the current
 * locale's short label (`O'zb` / `Рус` / `Eng`) + chevron, opens a
 * tiny dropdown card with the full names. The chevron rotates 180° on
 * open.
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
    const target = (segments.join('/') || `/${next}`) as Route;
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
        aria-label="Language"
        className={cn(
          'flex h-8 items-center gap-1 rounded-md border px-2.5 transition-colors',
          'border-[rgba(22,34,31,0.09)] bg-[#eef4f3] text-[#16221f] hover:border-[#0f766e] hover:text-[#0f766e]',
          'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6]',
          'text-[12px] font-semibold',
        )}
      >
        {current.short}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 min-w-[140px] p-1 rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-50"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => switchTo(l.code)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 rounded-[7px] text-[13px] transition-colors',
                l.code === locale
                  ? 'text-[#0f766e] dark:text-[#14b8a6] font-semibold'
                  : 'text-[#62716d] dark:text-[#94a3b8] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white',
              )}
            >
              <span>{l.short}</span>
              <span className="text-[11px] text-[#62716d] dark:text-[#94a3b8] font-normal">
                {l.label}
              </span>
              {l.code === locale ? (
                <span className="ml-auto text-[12px]" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
