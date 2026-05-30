'use client';

import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * Legacy login passthrough — every authentication flow goes through the
 * universal portal at `/panel/portal/{locale}/login`. Renders nothing;
 * the useEffect handles both bookmarked-while-logged-in and not-logged-in
 * cases with an immediate redirect.
 */
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  const token = useAuthStore((s) => s.token);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  useEffect(() => {
    if (!isBootstrapped) return;

    if (token) {
      router.replace(`/${locale}/overview` as Route);
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/login`;
    }
  }, [isBootstrapped, token, locale, router]);

  return null;
}
