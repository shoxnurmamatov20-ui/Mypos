'use client';

import { useParams } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

/**
 * Wraps authenticated routes. Behaviour:
 *   1. While the session is hydrating → render nothing (blank).
 *   2. Hydrated, no token → bounce to the universal portal login.
 *   3. Otherwise → render `children`.
 *
 * Blank instead of a spinner during the hydrate window so route
 * transitions don't show a noisy flash.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (!token && typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/login`;
    }
  }, [isBootstrapped, token, locale]);

  if (!isBootstrapped || !token) {
    return null;
  }

  return <>{children}</>;
}
