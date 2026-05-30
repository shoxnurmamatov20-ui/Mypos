'use client';

import { useEffect } from 'react';

/**
 * Fallback router for legacy `/dispatch` hits — mobile portal,
 * old bookmarks, redirects from third-party SSO. Reads the
 * stashed URL and goes there immediately, no UI shown.
 *
 * The primary login flow no longer touches this page (the portal
 * LoginForm now redirects directly to the target panel), so this
 * exists purely as a safety net.
 */
export function DispatchScreen({ locale }: { locale: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.sessionStorage.getItem('mypos_redirect');
    window.sessionStorage.removeItem('mypos_redirect');

    const url = stored ?? `http://localhost:3000/panel/manager/${locale}/overview`;
    window.location.replace(url);
  }, [locale]);

  return null;
}
