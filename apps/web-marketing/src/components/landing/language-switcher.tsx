'use client';

import { Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { routing } from '@/i18n/routing';

const labels: Record<string, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
  kz: 'Қазақша',
};

/**
 * Apple-style locale dropdown — pearl button, hairline ring,
 * canvas dropdown with hairline rows.
 */
export function LanguageSwitcher({ align = 'right' }: { align?: 'left' | 'right' }) {
  const t = useTranslations('footer');
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
    <div className="relative inline-block text-caption">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('lang_label')}
        className="inline-flex h-9 items-center gap-xs rounded-pearl bg-pearl px-sm text-caption-strong text-ink shadow-hairline-ring transition-transform duration-fast active:scale-95"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{labels[locale] ?? locale.toUpperCase()}</span>
      </button>
      {open ? (
        <ul
          role="menu"
          className={`absolute z-50 mt-xxs min-w-[9rem] overflow-hidden rounded-card bg-canvas shadow-hairline-ring ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {routing.locales.map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => switchTo(code)}
                className={`block w-full px-md py-xs text-left text-body transition-colors duration-fast hover:bg-parchment ${
                  code === locale ? 'bg-coral-tint text-coral' : 'text-ink'
                }`}
              >
                {labels[code]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
