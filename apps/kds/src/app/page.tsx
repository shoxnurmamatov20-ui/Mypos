'use client';

import { Loader2 } from 'lucide-react';
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
    <main className="flex h-screen items-center justify-center bg-white dark:bg-[#0b1120]">
      <Loader2
        className="h-8 w-8 animate-spin text-[#0f766e] dark:text-[#14b8a6]"
        aria-hidden="true"
      />
    </main>
  );
}
