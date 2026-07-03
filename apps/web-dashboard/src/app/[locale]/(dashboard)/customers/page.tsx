import { PageHeader } from '@mypos/ui';
import { getTranslations } from 'next-intl/server';
import { CustomersManager } from './_components/customers-manager';

export async function generateMetadata() {
  const t = await getTranslations('customers');
  return { title: `${t('title')} — MyPOS` };
}

export default async function CustomersPage() {
  const t = await getTranslations('customers');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <CustomersManager />
    </div>
  );
}
