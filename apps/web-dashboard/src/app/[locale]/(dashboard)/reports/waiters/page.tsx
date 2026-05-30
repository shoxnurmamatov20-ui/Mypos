import { getTranslations } from 'next-intl/server';
import { WaitersReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('waiters_report')} — MyPOS` };
}

export default async function WaitersReportPage() {
  return <WaitersReportView />;
}
