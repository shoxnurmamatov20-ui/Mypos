import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@mypos/ui';
import { EmployeesManager } from './_components/employees-manager';

export async function generateMetadata() {
  const t = await getTranslations('employees');
  return { title: `${t('title')} — MyPOS` };
}

export default async function EmployeesPage() {
  const t = await getTranslations('employees');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <EmployeesManager />
    </div>
  );
}
