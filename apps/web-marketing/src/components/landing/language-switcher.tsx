'use client';

import { CaretDown } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

const LOCALES = [
  { code: 'uz', short: "O'zb", label: "O'zbekcha" },
  { code: 'ru', short: 'Рус', label: 'Русский' },
  { code: 'en', short: 'Eng', label: 'English' },
  { code: 'kz', short: 'Қаз', label: 'Қазақша' },
] as const;

interface Props {
  align?: 'left' | 'right';
}

/**
 * Superadmin-style `lang-drop` — 32px chip showing the current
 * locale's short label (O'zb / Рус / Eng / Қаз) + chevron. Opens a
 * tiny dropdown card with the full names + check on the active row.
 */
export function LanguageSwitcher({ align = 'right' }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function switchTo(next: string) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    const parts = pathname.split('/');
    parts[1] = next;
    const target = parts.join('/') || `/${next}`;
    startTransition(() => {
      router.push(target);
      setOpen(false);
    });
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
        className="flex h-8 items-center gap-1 rounded-md border border-[rgba(15,23,42,0.08)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#022F2F] px-2.5 text-[12px] font-semibold text-[#0f172a] dark:text-white hover:border-[#0f766e]/40 dark:hover:border-[#14b8a6]/50 hover:text-[#0f766e] dark:hover:text-[#14b8a6] transition-colors"
      >
        {current.short}
        <CaretDown
          size={11}
          weight="bold"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute top-full mt-1.5 min-w-[150px] p-1 rounded-[10px] border border-[rgba(15,23,42,0.08)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#022F2F] shadow-[0_8px_28px_-12px_rgba(15,23,42,0.30)] z-50 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {LOCALES.map((l) => {
            const isActive = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="menuitem"
                onClick={() => switchTo(l.code)}
                className={`flex w-full items-center gap-2 px-3 py-2 rounded-[7px] text-[13px] transition-colors ${
                  isActive
                    ? 'text-[#0f766e] dark:text-[#14b8a6] font-semibold'
                    : 'text-[#475569] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-white/[0.06] hover:text-[#0f172a] dark:hover:text-white'
                }`}
              >
                <span>{l.short}</span>
                <span className="text-[11px] font-normal text-[#64748b] dark:text-[#94a3b8]">
                  {l.label}
                </span>
                {isActive ? (
                  <span className="ml-auto text-[12px]" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
