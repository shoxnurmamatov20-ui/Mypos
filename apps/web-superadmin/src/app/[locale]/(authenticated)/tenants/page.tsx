import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { TenantsListView } from '@/components/tenants/tenants-list-view';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tenants_page' });
  return { title: t('title') };
}

export default async function TenantsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TenantsListView locale={locale} />;
}
