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
};

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
    <div className="relative inline-block text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('lang_label')}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 font-medium text-neutral-700 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{labels[locale] ?? locale.toUpperCase()}</span>
      </button>
      {open ? (
        <ul
          role="menu"
          className={`absolute z-50 mt-2 min-w-[9rem] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {routing.locales.map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => switchTo(code)}
                className={`block w-full px-4 py-2 text-left transition hover:bg-brand-50 ${
                  code === locale ? 'bg-brand-50 font-semibold text-brand-700' : 'text-neutral-700'
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
