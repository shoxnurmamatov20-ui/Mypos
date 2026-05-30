'use client';

import { ApiError, type AuthUser, authApi } from '@mypos/api-client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { apiClient, clearToken, getStoredToken, storeToken } from '@/lib/api';

/**
 * Kitchen session — the single source of truth for "who is at this
 * kitchen station". Wraps the authenticated `(app)` route group so the
 * sidebar, topbar and every page can read the cook's name + tenant
 * without each one re-fetching `/auth/me`.
 *
 * Auth model is unchanged from the legacy KDS: a Sanctum bearer token
 * lives in localStorage, handed off from the universal portal via a
 * `#token=` URL fragment. This provider only *consumes* that token —
 * the portal still owns login.
 */

type KitchenSession = {
  user: AuthUser;
  tenantId: string | null;
  logout: () => void;
};

const SessionContext = createContext<KitchenSession | null>(null);

/** Read the cook's session inside any `(app)` page or layout component. */
export function useKitchenSession(): KitchenSession {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useKitchenSession must be used within <KitchenSessionProvider>');
  }
  return ctx;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0b1120]">
      <Loader2
        className="h-8 w-8 animate-spin text-[#0f766e] dark:text-[#14b8a6]"
        aria-hidden="true"
      />
    </div>
  );
}

export function KitchenSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Portal handoff: a `#token=` fragment is read once, persisted, then
    // stripped from the URL so back/forward never re-use a stale token.
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#token=')) {
      const fragParams = new URLSearchParams(window.location.hash.slice(1));
      const incoming = fragParams.get('token');
      if (incoming) {
        storeToken(incoming);
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
    }

    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    authApi
      .me(apiClient)
      .then((res) => {
        if (cancelled) return;
        setUser(res.data);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace('/login');
          return;
        }
        // Network / 5xx — still let the board mount; react-query on the
        // page will surface its own retry/error state.
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function logout() {
    clearToken();
    router.replace('/login');
  }

  if (!ready || !user) {
    return <FullScreenLoader />;
  }

  return (
    <SessionContext.Provider value={{ user, tenantId: user.tenant?.id ?? null, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
