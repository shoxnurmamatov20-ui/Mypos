'use client';

import { Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { routing } from '@/i18n/routing';

const LOCALES = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kz', label: 'Қазақша', flag: '🇰🇿' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-xl"
        >
          {LOCALES.map((l) => (
            <li key={l.code} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => switchTo(l.code)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-neutral-50 ${
                  l.code === locale ? 'font-bold text-brand-600' : 'text-neutral-700'
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {l.flag}
                </span>
                <span>{l.label}</span>
                {l.code === locale ? <span className="ml-auto">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
