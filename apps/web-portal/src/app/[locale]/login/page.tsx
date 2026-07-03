import { setRequestLocale } from 'next-intl/server';
import { PortalShell } from '@/components/PortalShell';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PortalShell>
      <LoginForm />
    </PortalShell>
  );
}
