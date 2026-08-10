'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { WaiterBottomNav } from './waiter-bottomnav';
import { WaiterGuard } from './waiter-guard';
import { WaiterSidebar } from './waiter-sidebar';
import { WaiterTopbar } from './waiter-topbar';

/**
 * Authenticated waiter-panel shell — a desktop sidebar (`WaiterSidebar`,
 * `lg:` and up) and a mobile bottom tab bar (`WaiterBottomNav`, below
 * `lg:`) share one set of routes; only one renders at a time per its own
 * breakpoint classes.
 *
 * The outer wrapper is a flex row at *every* breakpoint with a dynamic
 * viewport-height floor (`min-h-dvh`) so the content column always spans
 * the screen — otherwise a short page (e.g. a filtered-down table list)
 * lets the sticky bottom nav ride up under the content.
 */
export function WaiterShell({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
      }),
  );

  return (
    <WaiterGuard>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-dvh bg-canvas">
          <WaiterSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <WaiterTopbar />
            <main className="flex-1 bg-parchment">
              <div className="mx-auto max-w-[1080px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                {children}
              </div>
            </main>
            <WaiterBottomNav />
          </div>
        </div>
      </QueryClientProvider>
    </WaiterGuard>
  );
}
