import { setRequestLocale } from 'next-intl/server';
import { DispatchScreen } from './DispatchScreen';

/**
 * Legacy `/dispatch` fallback. The primary login flow now goes directly
 * from LoginForm to the target panel — this exists for old bookmarks /
 * mobile-portal SSO handoffs. No UI shown; immediate redirect.
 */
export default async function DispatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DispatchScreen locale={locale} />;
}
