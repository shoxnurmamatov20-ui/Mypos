'use client';

import { ArrowRight, Search } from 'lucide-react';
import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

const CMD_OPEN_EVENT = 'mypos:cmd-palette-open';

type CmdItem = {
  label: string;
  group: string;
  action: string;
  hint?: string;
};

/**
 * ShifoReyting `cmd-overlay` + `cmd-modal` 1:1 in React. Opens via the
 * cmd-trigger button in the topbar OR the global Ctrl/Cmd+K shortcut.
 *
 * Keyboard: ↑↓ navigate, Enter run, Esc close. Click on the dimmed
 * backdrop also closes. Filter is plain `String.includes`-based across
 * label + hint + group — same matcher as the source.
 */
export function CommandPalette() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const { setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Static command catalog — order drives the rendered group order.
  const allItems: CmdItem[] = useMemo(
    () => [
      { label: 'Umumiy ko’rinish', group: 'Navigatsiya', action: 'nav:overview', hint: 'Boshqaruv paneli' },
      { label: 'Restoranlarim', group: 'Navigatsiya', action: 'nav:restaurants' },
      { label: 'Moliya', group: 'Navigatsiya', action: 'nav:finances' },
      { label: 'Davr: 7 kun', group: 'Davr', action: 'period:7d' },
      { label: 'Davr: 30 kun', group: 'Davr', action: 'period:30d' },
      { label: 'Davr: 90 kun', group: 'Davr', action: 'period:90d' },
      { label: 'Davr: 1 yil', group: 'Davr', action: 'period:1y' },
      { label: "Yorug' rejim", group: 'Tezkor', action: 'theme:light' },
      { label: 'Tungi rejim', group: 'Tezkor', action: 'theme:dark' },
      { label: 'Tizim rejimi', group: 'Tezkor', action: 'theme:system' },
      { label: 'Tizimdan chiqish', group: 'Tezkor', action: 'logout' },
    ],
    [],
  );

  const filtered = useMemo<CmdItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) =>
      `${it.label} ${it.hint ?? ''} ${it.group}`.toLowerCase().includes(q),
    );
  }, [query, allItems]);

  // Group items keeping insertion order.
  const grouped = useMemo<
    ReadonlyArray<{ group: string; items: ReadonlyArray<{ item: CmdItem; idx: number }> }>
  >(() => {
    const map = new Map<string, Array<{ item: CmdItem; idx: number }>>();
    filtered.forEach((item, idx) => {
      const list = map.get(item.group) ?? [];
      list.push({ item, idx });
      map.set(item.group, list);
    });
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, [filtered]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIdx(0);
  }, []);

  const runAction = useCallback(
    (action: string) => {
      close();
      if (action.startsWith('nav:')) {
        const path = action.slice(4);
        router.push(`/${locale}/${path}` as Route);
        return;
      }
      if (action.startsWith('period:')) {
        const key = action.slice(7);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mypos_ceo_period', key);
          window.dispatchEvent(new CustomEvent('mypos:period-change', { detail: { key } }));
        }
        return;
      }
      if (action.startsWith('theme:')) {
        setTheme(action.slice(6));
        return;
      }
      if (action === 'logout') {
        logout();
        const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
        window.location.href = `${portal}/${locale}/logout`;
      }
    },
    [close, locale, logout, router, setTheme],
  );

  // Open via global event from the trigger button.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(CMD_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CMD_OPEN_EVENT, onOpen);
  }, []);

  // Global keyboard handlers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = filtered[activeIdx];
        if (it) runAction(it.action);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIdx, close, runAction]);

  // Focus input + reset state on open.
  useEffect(() => {
    if (!open) return;
    setActiveIdx(0);
    setQuery('');
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  // Scroll active item into view as user navigates.
  useEffect(() => {
    if (!open) return;
    const el = resultsRef.current?.querySelector<HTMLAnchorElement>(
      `[data-cmd-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buyruqlar paneli"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 z-[1000] flex justify-center pt-[12vh] bg-[rgba(10,15,20,0.5)] backdrop-blur-[3px] animate-[cmdIn_0.12s_ease-out]"
    >
      <div className="w-[min(620px,92vw)] h-fit rounded-xl overflow-hidden bg-white dark:bg-[#111827] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
          <Search
            className="w-4 h-4 text-[#62716d] dark:text-[#94a3b8] flex-shrink-0"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Qidiruv yoki buyruq yozing..."
            autoComplete="off"
            className="flex-1 bg-transparent border-0 outline-none text-[14px] text-[#16221f] dark:text-white font-medium placeholder:text-[#62716d] dark:placeholder:text-[#94a3b8]"
          />
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#62716d] dark:text-[#94a3b8]">
              Hech narsa topilmadi
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <div className="px-2.5 pt-2.5 pb-1.5 text-[10px] font-bold tracking-[0.06em] uppercase text-[#62716d] dark:text-[#94a3b8]">
                  {group}
                </div>
                {items.map(({ item, idx }) => (
                  <a
                    key={`${group}-${idx}`}
                    data-cmd-idx={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      runAction(item.action);
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-[9px] rounded-md cursor-pointer text-[13px] transition-colors',
                      idx === activeIdx
                        ? 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#16221f] dark:text-white'
                        : 'text-[#16221f] dark:text-[#e2e8f0]',
                    )}
                  >
                    <ArrowRight
                      className="w-[15px] h-[15px] text-[#62716d] dark:text-[#94a3b8] flex-shrink-0"
                      strokeWidth={2}
                    />
                    <span className="flex-1 font-semibold truncate">{item.label}</span>
                    {item.hint ? (
                      <span className="text-[11px] font-medium text-[#62716d] dark:text-[#94a3b8] truncate">
                        {item.hint}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3.5 px-3.5 py-2 border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[11px] text-[#62716d] dark:text-[#94a3b8]">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            harakat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            tanlash
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            yopish
          </span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-[#eef4f3] dark:bg-[#1a2235] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[10px] font-bold text-[#62716d] dark:text-[#94a3b8]">
      {children}
    </kbd>
  );
}

/** Imperative open — used by the cmd-trigger button. */
export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CMD_OPEN_EVENT));
  }
}
