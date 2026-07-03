import { redirect } from 'next/navigation';

/**
 * The cashier panel has no landing page — the POS screen is home. Bounce
 * `/{locale}` straight to `/{locale}/pos`.
 */
export default async function LocaleIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/pos`);
}
