'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getStoredToken } from '@/lib/api';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.replace('/board');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <main className="flex h-screen items-center justify-center bg-neutral-900">
      <p className="text-2xl text-neutral-400">Yuklanmoqda…</p>
    </main>
  );
}
