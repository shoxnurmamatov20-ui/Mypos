import { getTranslations } from 'next-intl/server';
import { StaffPositionView } from '../_components/staff-position-view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('staff_cashier')} — MyPOS` };
}

export default async function CashierPage() {
  const t = await getTranslations('sidebar');
  return (
    <StaffPositionView
      title={t('staff_cashier')}
      description={t('staff_descriptions.staff_cashier')}
      position="cashier"
    />
  );
}
