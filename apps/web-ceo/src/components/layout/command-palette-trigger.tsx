'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { openCommandPalette } from './command-palette';

/**
 * ShifoReyting `cmd-trigger` — pill button anchored on the right of
 * the topbar. Shows a search glyph, the word "Qidiruv", and `Ctrl K`
 * keyboard hint. Clicking dispatches the global open-event consumed
 * by `<CommandPalette>`; the same component owns the Ctrl/Cmd+K
 * shortcut so we only need to handle clicks here.
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
        'hidden md:inline-flex h-8 items-center gap-2 rounded-md border px-2.5 transition-colors',
        'border-[rgba(22,34,31,0.09)] bg-white text-[#62716d]',
        'hover:bg-[#eef4f3] hover:text-[#16221f]',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:text-[#94a3b8]',
        'dark:hover:bg-[#1a2235] dark:hover:text-white',
      )}
      title="Qidiruv va buyruqlar (Ctrl+K)"
    >
      <Search className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
      <span className="text-[12px] font-semibold">Qidiruv</span>
      <span className="flex items-center gap-0.5">
        <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-[#eef4f3] dark:bg-[#1a2235] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[10px] font-bold text-[#62716d] dark:text-[#94a3b8]">
          {isMac ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-[#eef4f3] dark:bg-[#1a2235] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[10px] font-bold text-[#62716d] dark:text-[#94a3b8]">
          K
        </kbd>
      </span>
    </button>
  );
}
