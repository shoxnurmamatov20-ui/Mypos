import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { PaymentClient } from './payment-client';

export async function generateMetadata() {
  const t = await getTranslations('settings');
  return { title: `${t('payment.title')} — MyPOS` };
}

export default async function PaymentMethodsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-6">
      <PageHeader title={t('payment.title')} description={t('payment.subtitle')} />
      <PaymentClient />
    </div>
  );
}
