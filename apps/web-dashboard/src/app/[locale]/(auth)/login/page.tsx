'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getStoredToken, storeToken } from '@/lib/api';

/**
 * CROSS-3 (2026-05-10): legacy local login is now a passthrough — every
 * authentication flow goes through the universal portal at
 * `localhost:3000/{locale}/login` (production: `mypos.uz/{locale}/login`).
 *
 * Behaviour:
 *   - URL hash carries `#token=...` from portal → persist + go to dashboard
 *   - Already have a token in localStorage → go to dashboard
 *   - Neither → bounce to portal with `return=` so user lands here on success
 */
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Token forwarded from the portal via fragment.
    if (window.location.hash.startsWith('#token=')) {
      const fragParams = new URLSearchParams(window.location.hash.slice(1));
      const incoming = fragParams.get('token');
      if (incoming) {
        storeToken(incoming);
        router.replace(`/${locale}/overview`);
        return;
      }
    }

    // Already authenticated locally.
    if (getStoredToken()) {
      router.replace(`/${locale}/overview`);
      return;
    }

    // Otherwise bounce to portal.
    window.location.href = `${PORTAL_URL}/${locale}/login`;
  }, [locale, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm">MyPOS portaliga yo'naltirilmoqda…</p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="size-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2A10 10 0 0122 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
