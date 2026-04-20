import { MenuView } from '@/components/MenuView';

type PageProps = {
  params: Promise<{ slug: string; tableId: string }>;
};

export default async function TenantTableMenuPage({ params }: PageProps) {
  const { slug, tableId } = await params;
  return <MenuView slug={slug} tableId={tableId} />;
}
