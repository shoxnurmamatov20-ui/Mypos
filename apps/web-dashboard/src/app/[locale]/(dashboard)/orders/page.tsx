import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { OrdersManager } from './_components/orders-manager';

export async function generateMetadata() {
  const t = await getTranslations('orders');
  return { title: `${t('title')} — MyPOS` };
}

export default async function OrdersPage() {
  const t = await getTranslations('orders');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <OrdersManager />
    </div>
  );
}
