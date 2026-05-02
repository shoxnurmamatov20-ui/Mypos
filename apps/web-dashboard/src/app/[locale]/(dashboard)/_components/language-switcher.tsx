'use client';

import { cn } from '@mypos/ui';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const LOCALES = ['uz', 'ru', 'en', 'kz'] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbek",
  ru: 'Русский',
  en: 'English',
  kz: 'Қазақша',
};

const LOCALE_SHORT: Record<Locale, string> = {
  uz: 'UZ',
  ru: 'RU',
  en: 'EN',
  kz: 'KZ',
};

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

function swapLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split('/');
  if (segments.length > 1 && segments[1] && isLocale(segments[1])) {
    segments[1] = nextLocale;
    return segments.join('/') || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const t = useTranslations('top_bar');
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const activeLocale: Locale = isLocale(currentLocale) ? currentLocale : 'uz';

  const handleSelect = (next: Locale) => {
    setOpen(false);
    if (next === activeLocale) return;
    const nextPath = swapLocaleInPath(pathname, next);
    router.replace(nextPath);
    router.refresh();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('language')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <Globe className="h-4 w-4 text-neutral-500" aria-hidden />
        <span>{LOCALE_SHORT[activeLocale]}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(locale)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50',
                locale === activeLocale && 'bg-brand-50 font-medium text-brand-700',
              )}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              <span className="text-xs text-neutral-500">{LOCALE_SHORT[locale]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
