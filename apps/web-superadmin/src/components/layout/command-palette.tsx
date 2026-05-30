'use client';

import { ArrowRight, Search } from 'lucide-react';
import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

const CMD_OPEN_EVENT = 'mypos:cmd-palette-open';
const RECENT_STORAGE_KEY = 'mypos_admin_cmd_recent';
const RECENT_MAX = 5;

type CmdItem = {
  label: string;
  group: string;
  action: string;
  hint?: string;
};

/**
 * Command palette — full-screen overlay with a centered modal,
 * backdrop blur, fuzzy search over a static catalogue of admin
 * actions. Keyboard: ↑↓ navigate, ↵ run, Esc close. Recent commands
 * persist in `localStorage` and surface in their own group when the
 * search is empty.
 *
 * Open via:
 *   - `<CommandPaletteTrigger>` button in the topbar
 *   - Global `Ctrl/Cmd + K` shortcut (registered here)
 *   - Imperative `openCommandPalette()` for programmatic launches
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
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Static command catalogue — order drives the rendered group order.
  const allItems: CmdItem[] = useMemo(
    () => [
      { label: 'Dashboard', group: 'Navigatsiya', action: 'nav:dashboard', hint: 'Boshqaruv paneli' },
      { label: "Tenant'lar", group: 'Navigatsiya', action: 'nav:tenants' },
      { label: 'Hisob-kitob', group: 'Navigatsiya', action: 'nav:billing' },
      { label: 'Audit log', group: 'Navigatsiya', action: 'nav:audit' },
      { label: 'Adminlar', group: 'Navigatsiya', action: 'nav:admins' },
      { label: 'Sozlamalar', group: 'Navigatsiya', action: 'nav:settings' },
      { label: 'Davr: 7 kun', group: 'Davr', action: 'period:7d' },
      { label: 'Davr: 30 kun', group: 'Davr', action: 'period:30d' },
      { label: 'Davr: 90 kun', group: 'Davr', action: 'period:90d' },
      { label: 'Davr: 1 yil', group: 'Davr', action: 'period:1y' },
      { label: "Yorug' rejim", group: 'Tezkor', action: 'theme:light' },
      { label: 'Tungi rejim', group: 'Tezkor', action: 'theme:dark' },
      { label: 'Tizim rejimi', group: 'Tezkor', action: 'theme:system' },
      { label: 'Bosh sahifa', group: 'Tezkor', action: 'url:http://localhost:3000/uz', hint: 'Public portal' },
      { label: 'Tizimdan chiqish', group: 'Tezkor', action: 'logout' },
    ],
    [],
  );

  // Filter on query; when blank, surface a "Yaqinda" group first.
  const filtered = useMemo<CmdItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recentItems = recent
        .map((action) => allItems.find((it) => it.action === action))
        .filter((x): x is CmdItem => x !== undefined)
        .map<CmdItem>((it) => ({ ...it, group: 'Yaqinda' }));
      const seen = new Set(recent);
      const rest = allItems.filter((it) => !seen.has(it.action));
      return [...recentItems, ...rest];
    }
    return allItems.filter((it) =>
      `${it.label} ${it.hint ?? ''} ${it.group}`.toLowerCase().includes(q),
    );
  }, [query, allItems, recent]);

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

  // Persist recently used actions (most recent first).
  const remember = useCallback((action: string) => {
    setRecent((prev) => {
      const next = [action, ...prev.filter((a) => a !== action)].slice(0, RECENT_MAX);
      try {
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  const runAction = useCallback(
    async (action: string) => {
      close();
      remember(action);
      if (action.startsWith('nav:')) {
        const path = action.slice(4);
        router.push(`/${locale}/${path}` as Route);
        return;
      }
      if (action.startsWith('period:')) {
        const key = action.slice(7);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mypos_admin_period', key);
          window.dispatchEvent(new CustomEvent('mypos:period-change', { detail: { key } }));
        }
        return;
      }
      if (action.startsWith('theme:')) {
        setTheme(action.slice(6));
        return;
      }
      if (action.startsWith('url:')) {
        window.location.href = action.slice(4);
        return;
      }
      if (action === 'logout') {
        await logout();
        const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
        window.location.href = `${portal}/${locale}/logout`;
      }
    },
    [close, locale, logout, remember, router, setTheme],
  );

  // Open via global event from the trigger button.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(CMD_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CMD_OPEN_EVENT, onOpen);
  }, []);

  // Hydrate recent list once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((x): x is string => typeof x === 'string').slice(0, RECENT_MAX));
        }
      }
    } catch {
      /* ignore */
    }
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
        if (it) void runAction(it.action);
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

  // Lock body scroll while open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buyruqlar paneli"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 z-[1000] flex justify-center px-4 pt-[8vh] sm:pt-[12vh] bg-gray-900/50 backdrop-blur-sm animate-[cmdIn_0.12s_ease-out]"
    >
      <div className="w-full max-w-[620px] h-fit rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl shadow-gray-900/40">
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search
            className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
            strokeWidth={2}
            aria-hidden="true"
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
            aria-label="Buyruq qidirish"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 dark:text-white font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 h-[18px] rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          role="listbox"
          aria-label="Buyruqlar"
          className="max-h-[60vh] overflow-y-auto p-1.5"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-900 dark:text-white font-semibold">
                Hech narsa topilmadi
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Boshqa kalit so&apos;z bilan urinib ko&apos;ring
              </p>
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <div className="px-2.5 pt-2.5 pb-1.5 text-[10px] font-bold tracking-[0.06em] uppercase text-gray-500 dark:text-gray-400">
                  {group}
                </div>
                {items.map(({ item, idx }) => (
                  <a
                    key={`${group}-${idx}`}
                    data-cmd-idx={idx}
                    role="option"
                    aria-selected={idx === activeIdx}
                    onClick={(e) => {
                      e.preventDefault();
                      void runAction(item.action);
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors duration-100',
                      idx === activeIdx
                        ? 'bg-teal-50 dark:bg-teal-500/10 text-gray-900 dark:text-white'
                        : 'text-gray-900 dark:text-gray-200',
                    )}
                  >
                    <ArrowRight
                      className={cn(
                        'w-3.5 h-3.5 flex-shrink-0',
                        idx === activeIdx
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-gray-500 dark:text-gray-400',
                      )}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span className="flex-1 font-semibold truncate">{item.label}</span>
                    {item.hint ? (
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate hidden sm:inline">
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
        <div className="hidden sm:flex items-center gap-3.5 px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            harakat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            tanlash
          </span>
          <span className="inline-flex items-center gap-1.5 ml-auto">
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
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400">
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
