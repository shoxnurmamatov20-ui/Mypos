import { getTranslations } from 'next-intl/server';
import { NotificationsLogClient } from './_client';

export async function generateMetadata() {
  const t = await getTranslations('sidebar');
  return { title: `${t('notifications_log')} — MyPOS` };
}

export default async function NotificationsLogPage() {
  return <NotificationsLogClient />;
}
