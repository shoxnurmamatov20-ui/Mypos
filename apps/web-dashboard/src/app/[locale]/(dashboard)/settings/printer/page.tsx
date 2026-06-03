import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { PrinterClient } from './printer-client';

export async function generateMetadata() {
  const t = await getTranslations('settings');
  return { title: `${t('printer.title')} — MyPOS` };
}

export default async function PrinterSettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-6">
      <PageHeader title={t('printer.title')} description={t('printer.subtitle')} />
      <PrinterClient />
    </div>
  );
}
