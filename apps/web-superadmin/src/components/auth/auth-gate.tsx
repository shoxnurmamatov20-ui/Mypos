'use client';

import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { storeToken } from '@/lib/api';

/**
 * AuthGate hydrates the session from localStorage on mount. It does **not**
 * gate rendering — every authenticated route uses `ProtectedRoute` for that.
 *
 * CROSS-2 (2026-05-10): also accepts a token handed over from the universal
 * portal (`apps/web-portal`, port 3000) via the URL fragment, since
 * localhost:3000 localStorage cannot be read from localhost:3003. Format:
 * `#token=<sanctum-token>&role=<role>`. Read-once: the fragment is stripped
 * after persisting so back/forward navigation never re-uses a stale token.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const loadStoredSession = useAuthStore((s) => s.loadStoredSession);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#token=')) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get('token');
      if (token) {
        storeToken(token);
        // Strip the fragment from the URL so it doesn't show up in
        // browser history / shared screenshots / referrer headers.
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    void loadStoredSession();
  }, [loadStoredSession]);

  return <>{children}</>;
}
