'use client';

import { type ReactNode, useEffect } from 'react';
import { storeToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

/**
 * Hydrates the cashier session on mount. It does NOT gate rendering — every
 * authenticated route uses `ProtectedRoute` for that.
 *
 * The universal portal (`web-portal`, :3005) cannot share localStorage with
 * this origin (:3008), so it hands the Sanctum bearer token over through the
 * URL fragment: `#token=<token>&role=cashier`. We read it once, persist it,
 * then strip the fragment so it never leaks into history / referrers /
 * screenshots.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const loadStoredSession = useAuthStore((s) => s.loadStoredSession);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#token=')) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get('token');
      if (token) {
        storeToken(token);
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    void loadStoredSession();
  }, [loadStoredSession]);

  return <>{children}</>;
}
