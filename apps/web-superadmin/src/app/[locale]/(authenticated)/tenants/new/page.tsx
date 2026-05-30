'use client';

import { useParams } from 'next/navigation';
import { NewTenantForm } from '@/components/tenants/new-tenant-form';

/**
 * Create-tenant page. Client-side only because the form lives entirely
 * here (react-hook-form + zod). When the backend exposes the create
 * endpoint, the submit handler will POST and redirect to the new tenant.
 */
export default function NewTenantPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  return <NewTenantForm locale={locale} />;
}
