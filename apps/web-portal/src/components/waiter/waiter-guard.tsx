'use client';

import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { readWaiterSession } from '@/lib/waiter-session';

/**
 * Gates every waiter-panel route.
 *
 *   1. While reading `localStorage` → render nothing (blank).
 *   2. No session, or the role isn't `waiter` → bounce to login.
 *   3. A valid waiter session → render `children`.
 */
export function WaiterGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readWaiterSession();
    if (!session || session.role !== 'waiter') {
      // useRouter from next/navigation auto-prefixes basePath.
      router.replace(`/${locale}/login` as Route);
      return;
    }
    setReady(true);
  }, [locale, router]);

  if (!ready) return null;

  return <>{children}</>;
}
