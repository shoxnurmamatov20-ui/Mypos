import { setRequestLocale } from 'next-intl/server';
import { AccountView } from '@/components/waiter/account-view';

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccountView />;
}
