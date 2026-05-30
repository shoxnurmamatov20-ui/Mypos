import { getTranslations } from 'next-intl/server';
import { DebtorsReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('debtors_report')} — MyPOS` };
}

export default async function DebtorsReportPage() {
  return <DebtorsReportView />;
}
