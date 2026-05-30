'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * Authenticated Kitchen shell — the web-superadmin layout pattern.
 * Sidebar fixed left, main column scrolls, content sits on a faint
 * off-white wash so white cards have something to contrast against.
 *
 * The shell is a flex column all the way down so the order board can
 * claim full viewport height and scroll its columns independently.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex min-h-screen bg-white dark:bg-[#0b1120]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 flex flex-col bg-gray-50/30 dark:bg-[#0b1120]">
          <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
