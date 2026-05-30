'use client';

import { useParams } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

/**
 * Wraps every authenticated cashier route:
 *   1. Session still hydrating → render nothing (blank).
 *   2. Hydrated, no user → bounce to the universal portal login.
 *   3. Hydrated, user present → render `children`.
 *
 * Blank during hydrate window — keeps page transitions clean.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (!user && typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/login`;
    }
  }, [isBootstrapped, user, locale]);

  if (!isBootstrapped || !user) {
    return null;
  }

  return <>{children}</>;
}
