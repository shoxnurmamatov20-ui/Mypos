'use client';

import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { useAuthStore } from '@/stores/auth';
import { AuthGuard } from './auth-guard';
import { CommandPalette } from './command-palette';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export interface DashboardShellProps {
  locale: string;
  children: React.ReactNode;
}

export function DashboardShell({ locale, children }: DashboardShellProps) {
  return (
    <AuthGuard>
      <AuthenticatedLayout locale={locale}>{children}</AuthenticatedLayout>
    </AuthGuard>
  );
}

/**
 * Authenticated chassis — mirrors the super-admin layout exactly: white rail,
 * a faint off-white content wash so the white cards inside have something to
 * contrast against, and `overflow-x-hidden` at every shell level so one wide
 * chart or table can never push the page into horizontal scroll.
 */
function AuthenticatedLayout({ locale, children }: { locale: string; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  useDashboardRealtime();
  if (!user) return null;

  return (
    <div className="lg:flex min-h-screen overflow-x-hidden bg-white dark:bg-[#0b1120]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <TopBar user={user} locale={locale} />
        <main id="main" className="flex-1 overflow-x-hidden bg-gray-50/30 dark:bg-[#0b1120]">
          <div className="mx-auto min-w-0 max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette locale={locale} />
    </div>
  );
}
