import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from './LoginForm';
import { PortalShell } from '@/components/PortalShell';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PortalShell>
      <LoginForm />
    </PortalShell>
  );
}
