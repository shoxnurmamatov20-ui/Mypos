'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getStoredToken, storeToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'uz';

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const load = useAuthStore((s) => s.load);

  useEffect(() => {
    // CROSS-2 (2026-05-10): accept a token handed over from the universal
    // portal at localhost:3000 via the URL fragment (#token=...&role=...).
    // Read-once: the fragment is stripped after persisting so back/forward
    // navigation never re-uses a stale token.
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#token=')) {
      const fragParams = new URLSearchParams(window.location.hash.slice(1));
      const incoming = fragParams.get('token');
      if (incoming) {
        storeToken(incoming);
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    const token = getStoredToken();
    if (!token) {
      router.replace(`/${locale}/login`);
      return;
    }
    if (!isLoaded && !isLoading) {
      void load();
    }
  }, [isLoaded, isLoading, load, locale, router]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoaded, user, locale, router]);

  if (!isLoaded || !user) {
    return null;
  }

  return <>{children}</>;
}
