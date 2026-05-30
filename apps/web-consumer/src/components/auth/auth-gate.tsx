'use client';

import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * AuthGate hydrates the session from localStorage on mount.
 *
 * Most consumer-web pages are public — only checkout/profile require auth
 * and those pages call `useRequireAuth()` to redirect to `/login`. This
 * gate just primes `useAuthStore` so the header can render the right CTA
 * (login button vs profile chip) without flicker.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const loadStoredSession = useAuthStore((s) => s.loadStoredSession);

  useEffect(() => {
    void loadStoredSession();
  }, [loadStoredSession]);

  return <>{children}</>;
}
