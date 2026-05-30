import { getTranslations } from 'next-intl/server';
import { CashflowReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('cashflow_report')} — MyPOS` };
}

export default async function CashflowReportPage() {
  return <CashflowReportView />;
}
