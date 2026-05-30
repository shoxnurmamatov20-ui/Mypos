'use client';

import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * CROSS-3 (2026-05-10): the legacy super-admin login page is now a passthrough
 * — every authentication flow goes through the universal portal at
 * `localhost:3000/{locale}/login` (production: `mypos.uz/{locale}/login`).
 *
 *   - If a session is already hydrated → straight to /dashboard.
 *   - Otherwise → redirect to portal with `return=` so the user lands here
 *     after successful login.
 *
 * Keeps the route alive (no 404) so any old bookmarks still work.
 */
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  useEffect(() => {
    if (!isBootstrapped) return;

    if (user?.is_super_admin) {
      router.replace(`/${locale}/dashboard` as Route);
      return;
    }

    // No session — bounce to portal. The portal will redirect back here
    // after a successful login (per config/auth_redirects.php).
    if (typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/login`;
    }
  }, [isBootstrapped, user, locale, router]);

  return null;
}
