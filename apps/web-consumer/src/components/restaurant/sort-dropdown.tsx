'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export type SortKey = 'popularity' | 'delivery' | 'price';

type SortDropdownProps = {
  value: SortKey;
  onChange: (key: SortKey) => void;
};

const OPTIONS: { key: SortKey; tKey: 'sort_popularity' | 'sort_delivery' | 'sort_price' }[] = [
  { key: 'popularity', tKey: 'sort_popularity' },
  { key: 'delivery', tKey: 'sort_delivery' },
  { key: 'price', tKey: 'sort_price' },
];

/**
 * Custom dropdown for sorting the restaurant grid.
 *
 * We don't reach for a heavy <select> wrapper because we want the open
 * state to live in React (for animations + focus management) while still
 * keeping the keyboard story simple — Esc closes, click outside closes,
 * arrow keys via the native button focus order.
 */
export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const t = useTranslations('restaurants_page');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const activeOption = OPTIONS.find((o) => o.key === value) ?? OPTIONS[0]!;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
      >
        <span className="text-neutral-500">{t('sort_label')}:</span>
        <span>{t(activeOption.tKey)}</span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t('sort_label')}
          className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-neutral-200 bg-white p-1 shadow-xl"
        >
          {OPTIONS.map((opt) => {
            const isActive = opt.key === value;
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={
                    isActive
                      ? 'flex w-full items-center justify-between gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-left text-sm font-bold text-brand-700'
                      : 'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-100'
                  }
                >
                  <span>{t(opt.tKey)}</span>
                  {isActive ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
