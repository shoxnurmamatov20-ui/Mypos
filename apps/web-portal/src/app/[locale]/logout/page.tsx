import { setRequestLocale } from 'next-intl/server';
import { LogoutScreen } from './LogoutScreen';

/**
 * Logout is an instant pass-through: the client clears tokens then
 * redirects to /login. No PortalShell / language chip / "you signed out"
 * splash — that intermediate page was confusing users.
 */
export default async function LogoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LogoutScreen locale={locale} />;
}
