'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

/**
 * Authenticated cashier shell: fixed sidebar, sticky topbar, scrolling main
 * column on a faint off-white wash so white cards have something to sit on.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white lg:flex dark:bg-[#0b1120]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-gray-50/40 dark:bg-[#0b1120]">
            <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
