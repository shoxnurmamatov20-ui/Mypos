import { Monitor } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { RolePlaceholder } from '../_components/role-placeholder';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('staff_monoblok')} — MyPOS` };
}

export default async function MonoblokPage() {
  const t = await getTranslations('sidebar');
  const tInv = await getTranslations('inventory');
  return (
    <RolePlaceholder
      icon={Monitor}
      title={t('staff_monoblok')}
      description={t('staff_descriptions.staff_monoblok')}
      badge={tInv('coming_soon')}
    />
  );
}
