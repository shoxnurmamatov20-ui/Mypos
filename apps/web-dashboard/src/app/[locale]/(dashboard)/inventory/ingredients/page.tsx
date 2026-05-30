import { getTranslations } from 'next-intl/server';
import { IngredientsClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('ingredients')} — MyPOS` };
}

export default async function IngredientsPage() {
  return <IngredientsClient />;
}
