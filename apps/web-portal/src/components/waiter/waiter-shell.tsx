'use client';

import type { ReactNode } from 'react';
import { WaiterGuard } from './waiter-guard';
import { WaiterSidebar } from './waiter-sidebar';
import { WaiterTopbar } from './waiter-topbar';

/**
 * Authenticated waiter-panel shell — same composition as the
 * `web-superadmin` `(authenticated)` layout: fixed sidebar on the left, a
 * sticky topbar, and a faintly-washed scrolling content column. The
 * content max-width is pulled in to 1080px to keep the panel compact.
 */
export function WaiterShell({ children }: { children: ReactNode }) {
  return (
    <WaiterGuard>
      <div className="min-h-screen bg-white lg:flex">
        <WaiterSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <WaiterTopbar />
          <main className="flex-1 bg-[#f7f9f9]">
            <div className="mx-auto max-w-[1080px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WaiterGuard>
  );
}
