import { getTranslations } from 'next-intl/server';
import { VisitsView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('visits')} — MyPOS` };
}

export default async function VisitsPage() {
  return <VisitsView />;
}
