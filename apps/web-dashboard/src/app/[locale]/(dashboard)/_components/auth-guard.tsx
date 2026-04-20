'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getStoredToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'uz';

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const load = useAuthStore((s) => s.load);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace(`/${locale}/login`);
      return;
    }
    if (!isLoaded && !isLoading) {
      void load();
    }
  }, [isLoaded, isLoading, load, locale, router]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoaded, user, locale, router]);

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50">
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
