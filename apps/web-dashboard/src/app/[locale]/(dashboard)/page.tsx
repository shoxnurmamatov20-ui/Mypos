import { redirect } from 'next/navigation';

// This file is an artifact of route-group scaffolding. The canonical home page
// lives in the outer /[locale]/page.tsx redirect; both resolve to /{locale}
// and perform the same redirect so behavior is identical regardless of which
// Next.js selects.
export default async function DashboardGroupRoot({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/overview`);
}
