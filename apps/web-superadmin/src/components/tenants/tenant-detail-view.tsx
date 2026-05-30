'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@mypos/api-client';
import { Building2, Loader2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Toast, useToast } from '@/components/ui/toast';
import {
  deleteTenant,
  fetchTenantDetail,
  impersonateTenant,
  suspendTenant,
  updateTenant,
  type UpdateTenantPayload,
} from '@/lib/api-helpers';
import {
  buildMockAuditEvents,
  buildMockOrders,
} from '@/data/mock-tenant-detail';
import type { TenantSummary } from '@/types/super-admin';
import { DeleteTenantModal } from './delete-tenant-modal';
import { EditSubscriptionModal } from './edit-subscription-modal';
import { ImpersonateConfirmModal } from './impersonate-confirm-modal';
import { SuspendTenantModal } from './suspend-tenant-modal';
import { TenantAuditLog } from './tenant-audit-log';
import { TenantDangerZone } from './tenant-danger-zone';
import { TenantDetailHeader } from './tenant-detail-header';
import { TenantOwnerCard } from './tenant-owner-card';
import { TenantRecentOrders } from './tenant-recent-orders';
import { TenantStatsGrid } from './tenant-stats-grid';
import { TenantSubscriptionCard } from './tenant-subscription-card';

type Props = {
  tenantId: string;
  locale: string;
};

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000/panel/manager/uz/overview';

/**
 * Per-tenant detail view — uses a dedicated single-tenant query so the
 * detail panel is always fresh, with the list-cache value supplying a
 * `placeholderData` fallback so navigation feels instant.
 */
export function TenantDetailView({ tenantId, locale }: Props) {
  const t = useTranslations('tenant_detail');
  const tList = useTranslations('tenants_page');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state: toastState, show: showToast, close: closeToast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const detailQuery = useQuery({
    queryKey: ['super-admin', 'tenant', tenantId],
    queryFn: () => fetchTenantDetail(tenantId),
    placeholderData: () => {
      // Fall back to the list cache while the dedicated detail call resolves.
      const list = queryClient.getQueryData<TenantSummary[]>(['super-admin', 'tenants']);
      return list?.find((row) => row.id === tenantId);
    },
    enabled: !!tenantId,
  });

  const tenant = detailQuery.data as TenantSummary | undefined;

  const orders = useMemo(() => (tenant ? buildMockOrders(tenant.id, 5) : []), [tenant]);
  const events = useMemo(
    () => (tenant ? buildMockAuditEvents(tenant.id, 8) : []),
    [tenant],
  );

  // Synthesize trial / subscription end dates so the cards have something
  // useful to show until the backend exposes the real fields.
  const defaultTrialEnds =
    tenant?.status === 'trialing'
      ? new Date(Date.parse(tenant.created_at) + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
      : '';
  const trialEndsAt =
    (tenant as TenantSummary & { trial_ends_at?: string | null } | undefined)?.trial_ends_at ??
    defaultTrialEnds;
  const subscriptionEndsAt =
    (tenant as TenantSummary & { subscription_ends_at?: string | null } | undefined)?.subscription_ends_at ??
    tenant?.suspended_at ??
    null;
  const notes =
    (tenant as TenantSummary & { notes?: string | null } | undefined)?.notes ?? '';
  const ownerPhone =
    (tenant as TenantSummary & { owner_phone?: string | null } | undefined)?.owner_phone ?? '';

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenant', tenantId] });
    void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
  };

  const updateMutation = useMutation({
    mutationFn: (patch: UpdateTenantPayload) => updateTenant(tenantId, patch),
    onSuccess: () => {
      invalidateAll();
      setEditOpen(false);
      setEditErrors({});
      showToast(t('subscription_updated_toast'), 'success');
    },
    onError: (err) => {
      // Surface backend field errors inline when status is 422.
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]> } | undefined;
        if (body?.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(body.errors)) {
            if (Array.isArray(msgs) && msgs[0]) mapped[key] = msgs[0];
          }
          setEditErrors(mapped);
          return;
        }
      }
      showToast(formatApiError(err), 'error');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({
      reason,
      notes: noteText,
    }: {
      reason: 'non_payment' | 'abuse' | 'other';
      notes?: string;
    }) => suspendTenant(tenantId, { reason, notes: noteText }),
    onSuccess: () => {
      invalidateAll();
      setSuspendOpen(false);
      showToast(t('tenant_suspended_toast'), 'success');
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTenant(tenantId),
    onSuccess: () => {
      invalidateAll();
      setDeleteOpen(false);
      showToast(t('tenant_deleted_toast'), 'success');
      router.push(`/${locale}/tenants` as Route);
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: () => impersonateTenant(tenantId),
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('mypos_impersonation_token', data.token);
      }
      const url = `${DASHBOARD_URL}#token=${encodeURIComponent(data.token)}&impersonating=1`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setImpersonateOpen(false);
      showToast(t('impersonate'), 'info');
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  if (detailQuery.isPending && !tenant) {
    return <TenantDetailSkeleton />;
  }

  if (detailQuery.isError && !tenant) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-300/40 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 p-10 text-center"
        role="alert"
      >
        <Loader2 className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-red-700 dark:text-red-200">
          Tenant ma&apos;lumotini yuklab bo&apos;lmadi
        </p>
        <p className="text-xs text-red-600/80 dark:text-red-300/80">
          Server bilan aloqa yo&apos;q — birozdan keyin qayta urinib ko&apos;ring
        </p>
        <button
          type="button"
          onClick={() => void detailQuery.refetch()}
          className="inline-flex h-9 items-center rounded-md border border-red-500/40 bg-white dark:bg-[#111827] px-3 text-xs font-bold text-red-700 dark:text-red-300 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-10 text-center">
        <Building2 className="h-10 w-10 text-gray-300 dark:text-gray-700" aria-hidden="true" />
        <p className="font-semibold text-[#16221f] dark:text-white">{t('tenant_not_found')}</p>
        <Link
          href={`/${locale}/tenants` as Route}
          className="text-sm font-semibold text-[#0f766e] dark:text-[#14b8a6] transition-colors hover:text-[#0b5e57] dark:hover:text-[#2dd4bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120] rounded"
        >
          {tList('title')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <TenantDetailHeader
        tenant={tenant}
        locale={locale}
        onEdit={() => setEditOpen(true)}
        onImpersonate={() => setImpersonateOpen(true)}
        onMore={() => showToast(t('more'), 'info')}
      />

      <TenantStatsGrid tenant={tenant} />

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <TenantSubscriptionCard
          tenant={tenant}
          trialEndsAt={trialEndsAt || null}
          subscriptionEndsAt={subscriptionEndsAt}
          notes={notes}
          onEdit={() => setEditOpen(true)}
          locale={locale}
        />
        <TenantOwnerCard
          tenant={tenant}
          ownerPhone={ownerPhone}
          onSendPasswordReset={() => showToast(t('password_reset_toast'), 'success')}
          locale={locale}
        />
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <TenantRecentOrders
          orders={orders}
          onViewAll={() => showToast(t('view_all'), 'info')}
        />
        <TenantAuditLog
          events={events}
          locale={locale}
          onViewAll={() => router.push(`/${locale}/audit?tenant_id=${tenant.id}` as Route)}
        />
      </div>

      <TenantDangerZone
        onSuspend={() => setSuspendOpen(true)}
        onCancel={() =>
          updateMutation.mutate({ subscription_status: 'cancelled' })
        }
        onDelete={() => setDeleteOpen(true)}
      />

      <EditSubscriptionModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditErrors({});
        }}
        onSave={(payload) => {
          const patch: UpdateTenantPayload = {};
          if (payload.plan !== tenant.plan) patch.subscription_plan = payload.plan;
          if (payload.status !== tenant.status) patch.subscription_status = payload.status;
          if (payload.trialEndsAt !== trialEndsAt) {
            patch.trial_ends_at = payload.trialEndsAt || null;
          }
          if (payload.notes !== notes) patch.notes = payload.notes;
          if (Object.keys(patch).length === 0) {
            setEditOpen(false);
            return;
          }
          updateMutation.mutate(patch);
        }}
        initialPlan={tenant.plan}
        initialStatus={tenant.status}
        initialTrialEndsAt={trialEndsAt}
        initialNotes={notes}
        loading={updateMutation.isPending}
        fieldErrors={editErrors}
      />

      <SuspendTenantModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={({ reason, notes: noteText }) => {
          suspendMutation.mutate({ reason, notes: noteText });
        }}
        loading={suspendMutation.isPending}
      />

      <ImpersonateConfirmModal
        open={impersonateOpen}
        onClose={() => setImpersonateOpen(false)}
        onConfirm={() => impersonateMutation.mutate()}
        loading={impersonateMutation.isPending}
      />

      <DeleteTenantModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        loading={deleteMutation.isPending}
      />

      <Toast
        open={toastState.open}
        message={toastState.message}
        variant={toastState.variant}
        onClose={closeToast}
      />
    </div>
  );
}

/** Pull a useful message out of either an ApiError envelope or a network error. */
function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string; errors?: Record<string, string[]> } | undefined;
    if (body?.message) return body.message;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
    if (err.status === 401 || err.status === 403) return 'Ruxsat yo\'q';
    return `HTTP ${err.status}`;
  }
  return 'Tarmoq xatosi';
}

/**
 * Tenant detail skeleton — mirrors the page layout (header, 4 KPIs,
 * 2 detail cards, 2 list cards, danger zone) so navigation never
 * shifts the visible region.
 */
function TenantDetailSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-1/2 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-32 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="h-10 w-24 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-24 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-10 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] animate-pulse"
          />
        ))}
      </div>
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
