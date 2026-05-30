import { getTranslations } from 'next-intl/server';
import { ZReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('z_report')} — MyPOS` };
}

export default async function ZReportPage() {
  return <ZReportView />;
}
