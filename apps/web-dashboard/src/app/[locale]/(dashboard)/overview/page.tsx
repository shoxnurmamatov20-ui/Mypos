import { getTranslations } from 'next-intl/server';
import { OverviewDashboard } from './_components/overview-dashboard';

export async function generateMetadata() {
  const t = await getTranslations('overview');
  return { title: `${t('title')} — MyPOS` };
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <OverviewDashboard locale={locale} />;
}
