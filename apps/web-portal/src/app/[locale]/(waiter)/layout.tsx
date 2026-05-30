import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { WaiterShell } from '@/components/waiter/waiter-shell';

/**
 * Waiter-panel route group (`/{locale}/tables|orders|menu|shift`).
 *
 * The `(waiter)` segment is a Next.js route group — it scopes this
 * authenticated shell to the four waiter screens without adding anything
 * to the URL. Login, forgot/reset password and `/dispatch` stay on the
 * bare `PortalShell` outside this group.
 */
export default async function WaiterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WaiterShell>{children}</WaiterShell>;
}
