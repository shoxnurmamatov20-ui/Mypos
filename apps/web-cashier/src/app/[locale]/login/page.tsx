'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

/**
 * Cashier login passthrough — every credential flow goes through the
 * universal portal. Renders nothing; useEffect handles the redirect.
 */
export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (user) {
      router.replace(`/${locale}/pos`);
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = `${PORTAL_URL}/${locale}/login`;
    }
  }, [isBootstrapped, user, locale, router]);

  return null;
}
