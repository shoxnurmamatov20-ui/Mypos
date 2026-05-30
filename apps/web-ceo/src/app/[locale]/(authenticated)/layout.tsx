'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CommandPalette } from '@/components/layout/command-palette';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

/**
 * Light-theme authenticated layout (himoya admin pattern). Sidebar fixed
 * left, main column scrolls, content area uses a faint off-white wash so
 * the white cards inside have something to contrast against.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="lg:flex min-h-screen bg-white dark:bg-[#0b1120]">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 bg-gray-50/30 dark:bg-[#0b1120]">
            <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
      </div>
    </ProtectedRoute>
  );
}
