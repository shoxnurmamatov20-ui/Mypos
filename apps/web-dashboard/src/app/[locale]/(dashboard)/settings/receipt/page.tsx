import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { ReceiptClient } from './receipt-client';

export async function generateMetadata() {
  const t = await getTranslations('settings');
  return { title: `${t('receipt.title')} — MyPOS` };
}

export default async function ReceiptSettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-6">
      <PageHeader title={t('receipt.title')} description={t('receipt.subtitle')} />
      <ReceiptClient />
    </div>
  );
}
