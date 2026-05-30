import { getTranslations } from 'next-intl/server';
import { TablesReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('tables_report')} — MyPOS` };
}

export default async function TablesReportPage() {
  return <TablesReportView />;
}
