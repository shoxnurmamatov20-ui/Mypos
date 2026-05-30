import { getTranslations } from 'next-intl/server';
import { StaffPositionView } from '../_components/staff-position-view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('staff_cook')} — MyPOS` };
}

export default async function CookPage() {
  const t = await getTranslations('sidebar');
  return (
    <StaffPositionView
      title={t('staff_cook')}
      description={t('staff_descriptions.staff_cook')}
      position="chef"
    />
  );
}
