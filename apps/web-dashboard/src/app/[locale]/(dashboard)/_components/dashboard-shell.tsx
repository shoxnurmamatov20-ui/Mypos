'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { AuthGuard } from './auth-guard';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export interface DashboardShellProps {
  locale: string;
  children: React.ReactNode;
}

export function DashboardShell({ locale, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AuthGuard>
      <AuthenticatedLayout locale={locale} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}>
        {children}
      </AuthenticatedLayout>
    </AuthGuard>
  );
}

function AuthenticatedLayout({
  locale,
  mobileOpen,
  setMobileOpen,
  children,
}: {
  locale: string;
  mobileOpen: boolean;
  setMobileOpen: (next: boolean) => void;
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar locale={locale} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-neutral-900/50"
          />
          <div className="relative z-50 h-full w-60">
            <Sidebar
              locale={locale}
              onNavigate={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
              showCloseButton
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} locale={locale} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
