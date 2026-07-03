'use client';

import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { useAuthStore } from '@/stores/auth';
import { AuthGuard } from './auth-guard';
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

function AuthenticatedLayout({ locale, children }: { locale: string; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  useDashboardRealtime();
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] text-[#16221f] dark:text-[#e2e8f0]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} locale={locale} />
        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
