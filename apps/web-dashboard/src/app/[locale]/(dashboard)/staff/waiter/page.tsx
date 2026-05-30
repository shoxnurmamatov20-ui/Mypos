import { getTranslations } from 'next-intl/server';
import { StaffPositionView } from '../_components/staff-position-view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('staff_waiter')} — MyPOS` };
}

export default async function WaiterPage() {
  const t = await getTranslations('sidebar');
  return (
    <StaffPositionView
      title={t('staff_waiter')}
      description={t('staff_descriptions.staff_waiter')}
      position="waiter"
    />
  );
}
