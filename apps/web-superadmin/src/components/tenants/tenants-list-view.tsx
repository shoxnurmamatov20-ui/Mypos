'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@mypos/api-client';
import { Download, PauseCircle, PlayCircle, Plus, Upload, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { SystemHealthBar } from '@/components/dashboard/system-health-bar';
import { Toast, useToast } from '@/components/ui/toast';
import {
  deleteTenant,
  fetchTenants,
  impersonateTenant,
  resumeTenant,
  suspendTenant,
} from '@/lib/api-helpers';
import type { PlanFilter, StatusFilter } from '@/lib/tenant-utils';
import type { TenantSummary } from '@/types/super-admin';
import { DeleteTenantModal } from './delete-tenant-modal';
import { ImpersonateConfirmModal } from './impersonate-confirm-modal';
import { SuspendTenantModal } from './suspend-tenant-modal';
import type { TenantAction } from './tenant-action-menu';
import { TenantsFilters, type OwnerFilter } from './tenants-filters';
import { TenantsPagination, type PerPage } from './tenants-pagination';
import {
  computeHealthCounts,
  filterByHealth,
  TenantsStatusChips,
  type TenantHealth,
} from './tenants-status-chips';
import {
  TenantsTable,
  type SortColumn,
  type SortDir,
  type SortState,
} from './tenants-table';

type Props = { locale: string };

const DEFAULT_SORT = { column: 'mrr' as SortColumn, dir: 'desc' as SortDir };
const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000/panel/manager/uz/overview';

/**
 * ShifoReyting `/admin/organizations` 1:1 React port — now backed by
 * TanStack Query for live data + mutations for suspend / resume /
 * delete / impersonate.
 */
export function TenantsListView({ locale }: Props) {
  const t = useTranslations('tenants_page');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state: toastState, show: showToast, close: closeToast } = useToast();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [healthFilter, setHealthFilter] = useState<TenantHealth>('all');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(25);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'change_plan' | 'delete'>('activate');

  const [suspendTarget, setSuspendTarget] = useState<TenantSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantSummary | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<TenantSummary | null>(null);

  // Debounce search input.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(id);
  }, [query]);

  const tenantsQuery = useQuery<TenantSummary[]>({
    queryKey: ['super-admin', 'tenants'],
    queryFn: fetchTenants,
  });

  const suspendMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      notes,
    }: {
      id: string;
      reason: 'non_payment' | 'abuse' | 'other';
      notes?: string;
    }) => suspendTenant(id, { reason, notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      setSuspendTarget(null);
      showToast(t('action_suspend'), 'success');
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeTenant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      showToast(t('action_resume'), 'success');
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      setDeleteTarget(null);
      showToast(t('action_delete'), 'success');
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => impersonateTenant(id),
    onSuccess: (data) => {
      try {
        // Hand the token to the dashboard via URL fragment — AuthGate strips
        // it after persisting. Sessionstorage is a fallback for same-origin
        // dashboards that may want to read it earlier.
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('mypos_impersonation_token', data.token);
        }
        const url = `${DASHBOARD_URL}#token=${encodeURIComponent(data.token)}&impersonating=1`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setImpersonateTarget(null);
        showToast(t('action_impersonate'), 'info');
      } catch {
        showToast('Failed to open dashboard tab', 'error');
      }
    },
    onError: (err) => {
      showToast(formatApiError(err), 'error');
    },
  });

  const allTenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const counts = useMemo(() => computeHealthCounts(allTenants), [allTenants]);

  const filtered = useMemo(() => {
    let list: ReadonlyArray<TenantSummary> = allTenants;
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.owner_email && t.owner_email.toLowerCase().includes(q)) ||
          (t.owner_name && t.owner_name.toLowerCase().includes(q)),
      );
    }
    if (planFilter !== 'all') list = list.filter((t) => t.plan === planFilter);
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (ownerFilter === 'has') list = list.filter((t) => !!(t.owner_email || t.owner_name));
    else if (ownerFilter === 'missing') list = list.filter((t) => !t.owner_email && !t.owner_name);
    list = filterByHealth(list, healthFilter);
    return list;
  }, [allTenants, debouncedQuery, planFilter, statusFilter, ownerFilter, healthFilter]);

  const sorted = useMemo<ReadonlyArray<TenantSummary>>(() => {
    if (!sort) return filtered;
    const copy = [...filtered];
    copy.sort(compareTenants(sort.column, sort.dir));
    return copy;
  }, [filtered, sort]);

  // Reset to page 1 on filter / sort changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, planFilter, statusFilter, ownerFilter, regionFilter, healthFilter, sort, perPage]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const pageRows = sorted.slice(startIdx, startIdx + perPage);

  const hasActiveFilters =
    debouncedQuery.length > 0 ||
    planFilter !== 'all' ||
    statusFilter !== 'all' ||
    ownerFilter !== 'all' ||
    regionFilter !== '' ||
    healthFilter !== 'all' ||
    sort?.column !== DEFAULT_SORT.column ||
    sort?.dir !== DEFAULT_SORT.dir;

  const onClearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setPlanFilter('all');
    setStatusFilter('all');
    setOwnerFilter('all');
    setRegionFilter('');
    setHealthFilter('all');
    setSort(DEFAULT_SORT);
  };

  const onToggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onToggleAllOnPage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of pageRows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });

  const onSortClick = (column: SortColumn) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) {
        const defaultDir: SortDir = column === 'name' ? 'asc' : 'desc';
        return { column, dir: defaultDir };
      }
      return { column, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  const onAction = (action: TenantAction, tenant: TenantSummary) => {
    switch (action) {
      case 'view':
      case 'edit':
        router.push(`/${locale}/tenants/${tenant.id}` as Route);
        break;
      case 'impersonate':
        setImpersonateTarget(tenant);
        break;
      case 'suspend':
        setSuspendTarget(tenant);
        break;
      case 'resume':
        resumeMutation.mutate(tenant.id);
        break;
      case 'delete':
        setDeleteTarget(tenant);
        break;
    }
  };

  const onBulkApply = () => {
    showToast(`${bulkAction}: ${selected.size} tanlandi`, 'info');
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* System health bar */}
      <SystemHealthBar />

      {/* Page title — small but discoverable */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#16221f] dark:text-white leading-tight tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-xs md:text-sm text-[#62716d] dark:text-[#94a3b8] tabular-nums">
            {t('count_label', { count: allTenants.length })}
          </p>
        </div>
      </div>

      {/* orgm-header — mobile: stack chips + actions vertically. */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 px-3.5 py-2.5 rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827]">
        <TenantsStatusChips current={healthFilter} onChange={setHealthFilter} counts={counts} />
        <div className="flex flex-wrap items-center gap-1.5 md:ml-auto">
          <button
            type="button"
            onClick={() => showToast('Import tez orada', 'info')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white text-[12px] font-bold transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            <Upload className="w-3 h-3" strokeWidth={2.2} aria-hidden="true" />
            Import
          </button>
          <button
            type="button"
            onClick={() => showToast(t('export_toast'), 'info')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white text-[12px] font-bold transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            <Download className="w-3 h-3" strokeWidth={2.2} aria-hidden="true" />
            Eksport
          </button>
          <Link
            href={`/${locale}/tenants/new` as Route}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0f766e] hover:bg-[#0b5e57] text-white text-[12px] font-bold transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
            Yangi tenant
          </Link>
        </div>
      </div>

      {/* orgm-filters */}
      <TenantsFilters
        query={query}
        onQueryChange={setQuery}
        plan={planFilter}
        onPlanChange={setPlanFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        region={regionFilter}
        onRegionChange={setRegionFilter}
        owner={ownerFilter}
        onOwnerChange={setOwnerFilter}
        onClear={onClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* orgm-bulk-bar */}
      {selected.size > 0 ? (
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-[rgba(15,118,110,0.30)] dark:border-[rgba(20,184,166,0.40)] bg-[rgba(15,118,110,0.10)] dark:bg-[rgba(20,184,166,0.18)] text-[12px] font-semibold text-[#16221f] dark:text-white"
          role="region"
          aria-label="Tanlangan amallar"
        >
          <span>
            <span className="text-[#0f766e] dark:text-[#14b8a6] font-extrabold tabular-nums">
              {selected.size}
            </span>{' '}
            ta tanlangan
          </span>
          <span className="hidden sm:inline text-[#62716d] dark:text-[#94a3b8] text-[11px]" aria-hidden="true">
            →
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)}
            aria-label="Amal turini tanlang"
            className="h-8 pl-2 pr-6 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[12px] font-semibold text-[#16221f] dark:text-white cursor-pointer outline-none focus-visible:border-[#0f766e] dark:focus-visible:border-[#14b8a6] focus-visible:ring-2 focus-visible:ring-[rgba(15,118,110,0.15)] dark:focus-visible:ring-[rgba(20,184,166,0.18)] w-full sm:w-auto"
          >
            <option value="activate">Faollashtirish</option>
            <option value="deactivate">To&apos;xtatish</option>
            <option value="change_plan">Tarifni o&apos;zgartirish…</option>
            <option value="delete">O&apos;chirish</option>
          </select>
          <button
            type="button"
            onClick={onBulkApply}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0f766e] hover:bg-[#0b5e57] text-white text-[11px] font-bold transition-colors w-full sm:w-auto justify-center active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
          >
            {bulkAction === 'activate' ? (
              <PlayCircle className="w-3 h-3" strokeWidth={2.2} aria-hidden="true" />
            ) : bulkAction === 'deactivate' ? (
              <PauseCircle className="w-3 h-3" strokeWidth={2.2} aria-hidden="true" />
            ) : null}
            Qo&apos;llash
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-transparent text-[#62716d] dark:text-[#94a3b8] text-[11px] font-bold transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white w-full sm:w-auto justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
          >
            <X className="w-3 h-3" strokeWidth={2.2} aria-hidden="true" />
            Bekor qilish
          </button>
        </div>
      ) : null}

      {/* Loading / error / empty / table */}
      {tenantsQuery.isPending ? (
        <TenantsListSkeleton />
      ) : tenantsQuery.isError ? (
        <div
          className="flex flex-col items-center gap-3 rounded-[10px] border border-red-300/40 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 p-8 text-center"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-200">
            Tenant ma&apos;lumotlarini yuklab bo&apos;lmadi
          </p>
          <p className="text-xs text-red-600/80 dark:text-red-300/80">
            Server bilan aloqa yo&apos;q — birozdan keyin qayta urinib ko&apos;ring
          </p>
          <button
            type="button"
            onClick={() => void tenantsQuery.refetch()}
            className="inline-flex h-9 items-center rounded-md border border-red-500/40 bg-white dark:bg-[#111827] px-3 text-xs font-bold text-red-700 dark:text-red-300 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
          >
            Qayta urinish
          </button>
        </div>
      ) : (
        <TenantsTable
          rows={pageRows}
          locale={locale}
          selected={selected}
          onToggle={onToggle}
          onToggleAll={onToggleAllOnPage}
          onAction={onAction}
          sort={sort}
          onSortChange={onSortClick}
        />
      )}

      {/* orgm-paginate */}
      <TenantsPagination
        page={safePage}
        totalPages={totalPages}
        totalRows={sorted.length}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      {/* Action modals — driven by selected target. */}
      <SuspendTenantModal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={({ reason, notes }) => {
          if (!suspendTarget) return;
          suspendMutation.mutate({ id: suspendTarget.id, reason, notes });
        }}
        loading={suspendMutation.isPending}
      />

      <ImpersonateConfirmModal
        open={!!impersonateTarget}
        onClose={() => setImpersonateTarget(null)}
        onConfirm={() => {
          if (!impersonateTarget) return;
          impersonateMutation.mutate(impersonateTarget.id);
        }}
        loading={impersonateMutation.isPending}
      />

      <DeleteTenantModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
        tenantName={deleteTarget?.name ?? ''}
        tenantSlug={deleteTarget?.slug ?? ''}
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

/** Stable, deterministic compare for the active sort column / direction. */
function compareTenants(column: SortColumn, dir: SortDir) {
  const mul = dir === 'asc' ? 1 : -1;
  return (a: TenantSummary, b: TenantSummary): number => {
    switch (column) {
      case 'name':
        return a.name.localeCompare(b.name) * mul;
      case 'mrr':
        return (a.mrr_minor - b.mrr_minor) * mul;
      case 'orders':
        return (a.total_orders_count - b.total_orders_count) * mul;
      case 'rating':
        return ((a.total_revenue_minor || 0) - (b.total_revenue_minor || 0)) * mul;
      case 'created':
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mul;
      case 'last_active': {
        const aT = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
        const bT = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
        return (aT - bT) * mul;
      }
    }
  };
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
 * Skeleton mirroring the final table layout so the page doesn't reflow
 * when data arrives. Header row + 8 data rows = a believable preview.
 */
function TenantsListSkeleton() {
  return (
    <div
      className="rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] overflow-hidden"
      aria-busy="true"
      aria-label="Yuklanmoqda"
    >
      <div className="bg-[#eef4f3] dark:bg-[#1a2235] h-9 border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]" />
      <ul className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-3.5 py-3">
            <div className="h-3.5 w-3.5 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-[26px] w-[26px] rounded-md animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-2.5 w-20 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-4 w-16 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800 hidden sm:block" />
            <div className="h-4 w-16 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800 hidden md:block" />
            <div className="h-3 w-20 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          </li>
        ))}
      </ul>
    </div>
  );
}
