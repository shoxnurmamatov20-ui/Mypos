import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { ResetForm } from './ResetForm';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PortalShell>
      {/* `ResetForm` reads `useSearchParams()` — Next 15 requires a
          Suspense boundary around client search-param reads so the page
          can still be statically prerendered. */}
      <Suspense fallback={null}>
        <ResetForm locale={locale} />
      </Suspense>
    </PortalShell>
  );
}
