import { getTranslations } from 'next-intl/server';
import { CancelledReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('cancelled_report')} — MyPOS` };
}

export default async function CancelledReportPage() {
  return <CancelledReportView />;
}
