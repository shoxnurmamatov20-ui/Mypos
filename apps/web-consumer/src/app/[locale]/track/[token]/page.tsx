import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { OrderTrackingView } from './_components/order-tracking-view';
import {
  isPublicLocale,
  publicConsumerApi,
  PublicApiError,
} from '@/lib/public-api';

/**
 * Public order tracking page — `/[locale]/track/[token]`.
 *
 * Reachable without auth: a guest who placed an order via
 * `/api/v1/public/orders` receives a `tracking_token` they can share.
 * The page is rendered server-side for the first paint, then the client
 * component takes over with TanStack Query polling. Once Reverb is wired
 * we'll swap polling for a websocket subscription.
 */

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};
  return {
    title: 'Track order — MyPOS',
    description: 'Track your MyPOS order in real time.',
    robots: { index: false, follow: false },
  };
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isPublicLocale(locale)) notFound();
  setRequestLocale(locale);

  let initial;
  try {
    initial = await publicConsumerApi.orders.track(token, { locale });
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }
    // Network / 5xx — render the client view with no initial data so it
    // can retry once mounted.
  }

  return (
    <OrderTrackingView
      token={token}
      locale={locale}
      initialData={initial ?? null}
    />
  );
}
