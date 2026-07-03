import { setRequestLocale } from 'next-intl/server';
import { PortalShell } from '@/components/PortalShell';
import { ForgotForm } from './ForgotForm';

export default async function ForgotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PortalShell>
      <ForgotForm locale={locale} />
    </PortalShell>
  );
}
