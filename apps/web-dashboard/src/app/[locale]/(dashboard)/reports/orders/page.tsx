import { getTranslations } from 'next-intl/server';
import { OrdersReportView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('orders_report')} — MyPOS` };
}

export default async function OrdersReportPage() {
  return <OrdersReportView />;
}
