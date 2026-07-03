'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { openCommandPalette } from './command-palette';

/**
 * Command palette trigger — pill button anchored in the topbar. Shows
 * a search glyph, the word "Qidiruv", and the platform-appropriate
 * `⌘K` / `Ctrl K` hint. Clicking dispatches the global open-event
 * consumed by `<CommandPalette>`. The palette itself also listens for
 * the global keyboard shortcut, so we only handle clicks here.
 */
export function CommandPaletteTrigger() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className={cn(
        'hidden md:inline-flex h-8 items-center gap-2 rounded-md border px-2.5 transition-colors duration-150',
        'border-gray-200 bg-white text-gray-500',
        'hover:bg-gray-100 hover:text-gray-900',
        'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
        'dark:hover:bg-gray-800 dark:hover:text-white',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
      )}
      title={`Qidiruv va buyruqlar (${isMac ? '⌘' : 'Ctrl'}+K)`}
      aria-label="Qidiruv va buyruqlar panelini ochish"
    >
      <Search className="h-3.5 w-3.5 opacity-60" strokeWidth={2} aria-hidden="true" />
      <span className="text-xs font-semibold">Qidiruv</span>
      <span className="flex items-center gap-0.5">
        <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400">
          {isMac ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400">
          K
        </kbd>
      </span>
    </button>
  );
}
