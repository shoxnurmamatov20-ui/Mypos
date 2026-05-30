import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardView } from '@/components/dashboard/dashboard-view';

/**
 * Super-admin dashboard route.
 *
 * Server Component — sets the locale for the request, generates metadata,
 * and hands rendering to the client-side `DashboardView` (which owns the
 * React Query reads + period filter state). The view itself falls back to
 * mock fixtures while the backend `/api/v1/super-admin/dashboard*`
 * endpoints are still being built.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardView locale={locale} />;
}
