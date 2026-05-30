'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getStoredToken, storeToken } from '@/lib/api';

/**
 * KDS legacy login passthrough — universal portal handles all credentials.
 * Renders nothing; useEffect persists any forwarded token and redirects.
 */
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.hash.startsWith('#token=')) {
      const fragParams = new URLSearchParams(window.location.hash.slice(1));
      const incoming = fragParams.get('token');
      if (incoming) {
        storeToken(incoming);
        router.replace('/board');
        return;
      }
    }

    if (getStoredToken()) {
      router.replace('/board');
      return;
    }

    window.location.href = `${PORTAL_URL}/uz/login`;
  }, [router]);

  return null;
}
