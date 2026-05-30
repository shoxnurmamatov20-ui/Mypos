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
        className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0f172a] px-2.5 py-1.5 text-[12px] font-medium text-[#16221f] dark:text-white hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] transition-colors"
      >
        <Globe className="h-3.5 w-3.5 text-[#62716d] dark:text-[#94a3b8]" aria-hidden />
        <span>{LOCALE_SHORT[activeLocale]}</span>
        <ChevronDown className="h-3 w-3 text-[#62716d] dark:text-[#94a3b8]" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0f172a] shadow-lg z-50"
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(locale)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-[13px] text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
                locale === activeLocale && 'bg-teal-50 dark:bg-teal-950/50 font-semibold text-teal-700 dark:text-teal-300',
              )}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              <span className="text-xs text-[#62716d] dark:text-[#94a3b8]">{LOCALE_SHORT[locale]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
