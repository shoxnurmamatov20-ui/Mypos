'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const LOCALES: Array<{ code: string; label: string; native: string }> = [
  { code: 'uz', label: "O'zbekcha", native: 'UZ' },
  { code: 'ru', label: 'Русский', native: 'RU' },
  { code: 'en', label: 'English', native: 'EN' },
  { code: 'kz', label: 'Қазақша', native: 'KZ' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const switchTo = (next: string) => {
    if (next === locale) {
      setOpen(false);
      return;
    }
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
    setOpen(false);
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-xxs h-9 px-sm rounded-pill border border-hairline-soft bg-pearl text-caption-strong text-ink hover:bg-canvas active:scale-95 transition-transform"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-mono text-[11px] tracking-wider">{current.native}</span>
        <svg className="size-3 text-ink-muted-48" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-11 min-w-[140px] bg-canvas border border-hairline-soft rounded-md py-xxs z-10 shadow-hairline-ring"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === locale}
              onClick={() => switchTo(l.code)}
              className={`w-full text-left px-sm py-xs text-body hover:bg-parchment transition-colors ${
                l.code === locale ? 'text-tenant' : 'text-ink'
              }`}
            >
              <span className="font-mono text-[11px] tracking-wider mr-xs text-ink-muted-48">
                {l.native}
              </span>
              {l.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
