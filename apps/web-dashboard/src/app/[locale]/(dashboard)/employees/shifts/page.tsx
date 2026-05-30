import { getTranslations } from 'next-intl/server';
import { ShiftsClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('shifts')} — MyPOS` };
}

export default async function ShiftsPage() {
  return <ShiftsClient />;
}
