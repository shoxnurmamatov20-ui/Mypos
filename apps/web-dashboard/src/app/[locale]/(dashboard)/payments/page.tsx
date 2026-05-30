import { getTranslations } from 'next-intl/server';
import { PaymentsClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('payments')} — MyPOS` };
}

export default async function PaymentsPage() {
  return <PaymentsClient />;
}
