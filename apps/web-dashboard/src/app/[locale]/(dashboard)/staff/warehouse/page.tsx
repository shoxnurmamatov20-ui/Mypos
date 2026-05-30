import { Warehouse } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { RolePlaceholder } from '../_components/role-placeholder';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('staff_warehouse')} — MyPOS` };
}

export default async function WarehouseStaffPage() {
  const t = await getTranslations('sidebar');
  const tInv = await getTranslations('inventory');
  return (
    <RolePlaceholder
      icon={Warehouse}
      title={t('staff_warehouse')}
      description={t('staff_descriptions.staff_warehouse')}
      badge={tInv('coming_soon')}
    />
  );
}
