import { setRequestLocale } from 'next-intl/server';
import { ForgotForm } from './ForgotForm';
import { PortalShell } from '@/components/PortalShell';

export default async function ForgotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PortalShell>
      <ForgotForm locale={locale} />
    </PortalShell>
  );
}
