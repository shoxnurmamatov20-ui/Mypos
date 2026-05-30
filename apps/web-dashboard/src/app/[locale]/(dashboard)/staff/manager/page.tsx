import { getTranslations } from 'next-intl/server';
import { StaffPositionView } from '../_components/staff-position-view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('staff_manager')} — MyPOS` };
}

export default async function ManagerPage() {
  const t = await getTranslations('sidebar');
  return (
    <StaffPositionView
      title={t('staff_manager')}
      description={t('staff_descriptions.staff_manager')}
      position="manager"
    />
  );
}
