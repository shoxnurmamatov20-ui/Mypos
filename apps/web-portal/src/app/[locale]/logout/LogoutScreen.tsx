'use client';

import { useEffect } from 'react';
import { logout } from '@/lib/api';

/**
 * Centralised logout — clears every per-app token, revokes the Sanctum
 * token server-side, then **immediately** redirects to /login. No
 * intermediate "you have signed out" splash screen (was confusing
 * users + adding a click).
 *
 * Localhost is one origin so localStorage scoped to localhost:3000 is what
 * the portal can clear here. The other ports' localStorage cannot be reached
 * cross-origin — they lose their token on next page load via the centralised
 * AuthGate which calls /me, gets 401 (because the Sanctum token is now
 * revoked), and clears its own storage.
 */
const PER_APP_KEYS = [
  'mypos_token',                  // portal
  'mypos_role',                   // portal
  'mypos_super_admin_token',      // web-superadmin
  'mypos_auth_token',             // web-dashboard / web-ceo / web-cashier
  'kds_auth_token',               // kds
];

export function LogoutScreen({ locale }: { locale: string }) {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await logout();
      } catch {
        // Already-revoked / network failure — nothing to undo locally.
      }
      if (cancelled || typeof window === 'undefined') return;

      for (const key of PER_APP_KEYS) {
        window.localStorage.removeItem(key);
      }
      window.sessionStorage.removeItem('mypos_redirect');

      // Hard nav (not router.replace) — guarantees a fresh page load so
      // AuthGate in any cached layout re-reads storage from scratch.
      window.location.replace(`/panel/portal/${locale}/login`);
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return null;
}
