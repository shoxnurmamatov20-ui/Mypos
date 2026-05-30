'use client';

import { type ReactNode, useEffect } from 'react';
import { consumeSsoHandoff } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

/**
 * AuthGate hydrates the session from localStorage on mount. It does **not**
 * gate rendering — every authenticated route uses `ProtectedRoute` for that.
 *
 * The universal portal (`apps/web-portal`, port 3005) hands a token over via
 * the URL fragment (`#token=<sanctum-token>&role=<role>`), since the portal's
 * origin cannot write our localStorage. `consumeSsoHandoff` reads it once,
 * persists it under our own key, then strips the fragment so it never shows
 * up in browser history / shared screenshots / referrer headers.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const loadStoredSession = useAuthStore((s) => s.loadStoredSession);

  useEffect(() => {
    consumeSsoHandoff();
    loadStoredSession();
  }, [loadStoredSession]);

  return <>{children}</>;
}
