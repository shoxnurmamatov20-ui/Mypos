'use client';

import { useParams } from 'next/navigation';
import { TenantDetailView } from '@/components/tenants/tenant-detail-view';

/**
 * Tenant detail. Renders entirely on the client because the data lives in
 * a TanStack Query cache shared with the list page (with a mock fallback).
 * Once the backend ships, swap `fetchTenants` for `/api/v1/super-admin/
 * tenants/:id` and convert this to a Server Component.
 */
export default function TenantDetailPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? 'uz';
  const id = params?.id ?? '';
  return <TenantDetailView tenantId={id} locale={locale} />;
}
