import { getTranslations } from 'next-intl/server';
import { CourierReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('courier_report')} — MyPOS` };
}

export default async function CourierReportPage() {
  return <CourierReportView />;
}
