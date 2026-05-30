import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { KitchenSessionProvider } from '@/lib/session';

/**
 * Authenticated `(app)` route group. Everything underneath — the order
 * board, history, settings — needs a signed-in cook, so the session
 * guard and the chrome (sidebar + topbar) live here once instead of in
 * every page.
 *
 * `KitchenSessionProvider` blocks render until `/auth/me` resolves (or
 * bounces to `/login` if there is no token), so child pages can assume
 * a valid session via `useKitchenSession()`.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <KitchenSessionProvider>
      <AppShell>{children}</AppShell>
    </KitchenSessionProvider>
  );
}
