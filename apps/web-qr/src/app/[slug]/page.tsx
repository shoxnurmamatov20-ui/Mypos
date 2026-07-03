import { MenuView } from '@/components/MenuView';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TenantMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const tRaw = sp.t;
  const tableId =
    typeof tRaw === 'string' ? tRaw : Array.isArray(tRaw) && tRaw.length > 0 ? tRaw[0] : undefined;

  return <MenuView slug={slug} tableId={tableId} />;
}
