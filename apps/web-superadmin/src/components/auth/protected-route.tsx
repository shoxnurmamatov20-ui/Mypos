'use client';

import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * Wraps authenticated routes. Behaviour:
 *   1. While the session is hydrating → render nothing (blank).
 *   2. Hydrated, no user → redirect to `/{locale}/login`.
 *   3. Hydrated, user without `is_super_admin` → also redirected.
 *   4. Otherwise → render `children`.
 *
 * We deliberately render nothing during the hydration window — a centred
 * spinner flashing for ~50-200ms felt noisy. The hydrate is fast enough
 * that a blank moment is preferable.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const user = useAuthStore((s) => s.user);

  const allowed = Boolean(user?.is_super_admin);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (!allowed) {
      router.replace(`/${locale}/login` as Route);
    }
  }, [isBootstrapped, allowed, locale, router]);

  if (!isBootstrapped || !allowed) {
    return null;
  }

  return <>{children}</>;
}
