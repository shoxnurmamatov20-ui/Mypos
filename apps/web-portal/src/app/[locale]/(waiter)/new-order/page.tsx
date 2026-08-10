import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { NewOrderView } from '@/components/waiter/new-order-view';

export default async function NewOrderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Suspense — NewOrderView reads `?table=` via useSearchParams.
  return (
    <Suspense fallback={null}>
      <NewOrderView />
    </Suspense>
  );
}
