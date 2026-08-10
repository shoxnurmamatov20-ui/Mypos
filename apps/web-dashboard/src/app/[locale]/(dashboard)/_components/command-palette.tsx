'use client';

import { cn } from '@mypos/ui';
import { CornerDownLeft, Search } from 'lucide-react';
import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LEAF_ICONS, SECTIONS } from './nav-config';

const CMD_OPEN_EVENT = 'mypos:cmd-palette-open';

/** Imperative launcher, so the trigger in the topbar can stay a dumb button. */
export function openCommandPalette(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CMD_OPEN_EVENT));
}

/**
 * ⌘K palette — same shape and chrome as the super-admin one, wired to this
 * panel's navigation.
 *
 * Entries are flattened out of `nav-config`, the same source the rail renders,
 * so the palette can never drift out of sync with the menu.
 */
type Entry = { id: string; href: string; sectionId: string };

const ENTRIES: readonly Entry[] = SECTIONS.flatMap((s) =>
  s.items
    ? s.items.map((it) => ({ id: it.id, href: it.href, sectionId: s.id }))
    : s.href
      ? [{ id: s.id, href: s.href, sectionId: s.id }]
      : [],
);

function normalize(value: string): string {
  return value.toLocaleLowerCase('en').normalize('NFKD').replace(/[̀-ͯ']/g, '');
}

export function CommandPaletteTrigger() {
  const t = useTranslations('sidebar');
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className={cn(
        'hidden h-8 items-center gap-2 rounded-md border px-2.5 transition-colors duration-150 md:inline-flex',
        'border-gray-200 bg-white text-gray-500',
        'hover:bg-gray-100 hover:text-gray-900',
        'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
        'dark:hover:bg-gray-800 dark:hover:text-white',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
      )}
      aria-label={t('search_placeholder')}
    >
      <Search className="h-3.5 w-3.5 opacity-60" strokeWidth={2} aria-hidden="true" />
      <span className="text-xs font-semibold">{t('search_placeholder')}</span>
      <span className="flex items-center gap-0.5">
        <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gray-200 bg-gray-100 px-1 text-[10px] font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {isMac ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gray-200 bg-gray-100 px-1 text-[10px] font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          K
        </kbd>
      </span>
    </button>
  );
}

export function CommandPalette({ locale: localeProp }: { locale?: string } = {}) {
  const t = useTranslations('sidebar');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = localeProp ?? params?.locale ?? 'uz';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const items = useMemo(() => {
    const labelled = ENTRIES.map((e) => ({ ...e, label: t(e.id), section: t(e.sectionId) }));
    const q = normalize(query.trim());
    if (!q) return labelled.slice(0, 8);
    return labelled
      .filter((e) => normalize(e.label).includes(q) || normalize(e.section).includes(q))
      .slice(0, 10);
  }, [query, t]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(CMD_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CMD_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(`/${locale}/${href}` as Route);
    },
    [locale, router],
  );

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (items.length ? (c + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (items.length ? (c - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = items[cursor];
      if (target) go(target.href);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('search_placeholder')}
      className="fixed inset-0 z-[1000] flex animate-[fadeIn_0.12s_ease-out] justify-center bg-gray-900/50 px-4 pt-[8vh] backdrop-blur-sm sm:pt-[12vh]"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="fixed inset-0 cursor-default"
      />

      <div className="relative h-fit w-full max-w-[620px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/40 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2.5 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <Search
            className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            // biome-ignore lint/a11y/noAutofocus: a command palette must take focus when it opens
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={t('search_placeholder')}
            className="flex-1 border-0 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
          />
          <kbd className="hidden h-[18px] items-center justify-center rounded border border-gray-200 bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 sm:inline-flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('search_empty')}
              </p>
            </div>
          ) : (
            items.map((item, i) => {
              const Icon = LEAF_ICONS[item.id];
              return (
                <button
                  key={`${item.sectionId}/${item.id}`}
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(item.href)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-100',
                    i === cursor
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                      : 'text-gray-700 dark:text-gray-300',
                  )}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        i === cursor
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-gray-400 dark:text-gray-500',
                      )}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="flex-1 truncate font-semibold">{item.label}</span>
                  <span className="hidden truncate text-[11px] font-medium text-gray-500 sm:inline dark:text-gray-400">
                    {item.section}
                  </span>
                  {i === cursor ? (
                    <CornerDownLeft
                      className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
