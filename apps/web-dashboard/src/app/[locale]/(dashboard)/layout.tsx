import { setRequestLocale } from 'next-intl/server';
import { DashboardShell } from './_components/dashboard-shell';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardShell locale={locale}>{children}</DashboardShell>;
}
