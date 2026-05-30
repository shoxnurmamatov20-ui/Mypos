'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@mypos/api-client';
import {
  AlertCircle,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import {
  TenantsPagination,
  type PerPage,
} from '@/components/tenants/tenants-pagination';
import { Toast, useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import {
  fetchAdmins,
  fetchInvitations,
  revokeAdmin,
  type AdminUserRecord,
  type InvitationRecord,
} from '@/lib/api-helpers';
import { useAuthStore, type SuperAdminRole } from '@/stores/auth';
import { ActiveAdminsTable } from './active-admins-table';
import { InvitationsTable } from './invitations-table';
import { InviteAdminModal } from './invite-admin-modal';

type Tab = 'active' | 'invitations';
type RoleFilter = 'all' | SuperAdminRole;
type MfaFilter = 'all' | 'enabled' | 'disabled';
type InvStatusFilter = 'all' | 'pending' | 'expired' | 'accepted';

const ROLE_OPTIONS: ReadonlyArray<RoleFilter> = [
  'all',
  'owner',
  'admin',
  'support',
  'finance',
  'developer',
];

const ADMINS_KEY = ['super-admin', 'admins'] as const;
const INVITATIONS_KEY = ['super-admin', 'invitations'] as const;

/** Derive a single invitation status from the API's date/boolean fields. */
function invitationStatus(inv: InvitationRecord): 'pending' | 'expired' | 'accepted' | 'revoked' {
  if (inv.revoked_at) return 'revoked';
  if (inv.accepted_at) return 'accepted';
  if (new Date(inv.expires_at).getTime() < Date.now()) return 'expired';
  return 'pending';
}

/**
 * Super-admin team management wired to `/api/v1/super-admin/admins`.
 * Page header with primary actions, KPI cards, tab-aware filter bar,
 * tab-aware table, and pagination — all derived from the two TanStack
 * queries.
 */
export function AdminsView() {
  const t = useTranslations('admins_page');
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('active');
  const [inviteOpen, setInviteOpen] = useState(false);

  // Active-admins filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [mfaFilter, setMfaFilter] = useState<MfaFilter>('all');

  // Invitation filters
  const [invStatusFilter, setInvStatusFilter] = useState<InvStatusFilter>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(25);

  const { state: toastState, show: showToast, close: closeToast } = useToast();

  // Debounce search.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 200);
    return () => window.clearTimeout(id);
  }, [search]);

  // Queries ─────────────────────────────────────────────────────────
  const adminsQuery = useQuery({
    queryKey: ADMINS_KEY,
    queryFn: fetchAdmins,
  });

  const invitationsQuery = useQuery({
    queryKey: INVITATIONS_KEY,
    queryFn: fetchInvitations,
  });

  const admins = useMemo<AdminUserRecord[]>(
    () => adminsQuery.data?.data ?? [],
    [adminsQuery.data],
  );
  const invitations = useMemo<InvitationRecord[]>(
    () => invitationsQuery.data?.data ?? [],
    [invitationsQuery.data],
  );

  // Mutations ───────────────────────────────────────────────────────
  const revokeMutation = useMutation({
    mutationFn: revokeAdmin,
    onMutate: async (uuid: string) => {
      // Optimistic: drop the admin from the cached list immediately.
      await queryClient.cancelQueries({ queryKey: ADMINS_KEY });
      const previous = queryClient.getQueryData<{ data: AdminUserRecord[] }>(ADMINS_KEY);
      if (previous) {
        queryClient.setQueryData<{ data: AdminUserRecord[] }>(ADMINS_KEY, {
          ...previous,
          data: previous.data.filter((a) => (a.uuid ?? a.id) !== uuid),
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ADMINS_KEY, ctx.previous);
      }
      const message =
        err instanceof ApiError
          ? ((err.body as { message?: string } | undefined)?.message ?? err.message)
          : (err as Error).message;
      showToast(message ?? t('action_revoke'), 'error');
    },
    onSuccess: () => {
      showToast(t('action_revoke'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMINS_KEY });
    },
  });

  // KPI counts ──────────────────────────────────────────────────────
  const totalAdmins = admins.length;
  const mfaEnabled = admins.filter((a) => a.mfa_enabled).length;
  const mfaPct = totalAdmins > 0 ? Math.round((mfaEnabled / totalAdmins) * 100) : 0;
  const pendingInvitations = invitations.filter((i) => invitationStatus(i) === 'pending').length;
  const activeRecently = admins.filter((a) => {
    if (!a.last_super_admin_login_at) return false;
    return Date.now() - new Date(a.last_super_admin_login_at).getTime() < 24 * 60 * 60 * 1000;
  }).length;

  // Filtering ───────────────────────────────────────────────────────
  const filteredAdmins = useMemo<AdminUserRecord[]>(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return admins.filter((a) => {
      const role = a.super_admin_role ?? 'support';
      if (roleFilter !== 'all' && role !== roleFilter) return false;
      if (mfaFilter === 'enabled' && !a.mfa_enabled) return false;
      if (mfaFilter === 'disabled' && a.mfa_enabled) return false;
      if (q && !`${a.name} ${a.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [admins, debouncedSearch, roleFilter, mfaFilter]);

  const filteredInvitations = useMemo<InvitationRecord[]>(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return invitations.filter((inv) => {
      const status = invitationStatus(inv);
      if (invStatusFilter !== 'all' && status !== invStatusFilter) return false;
      if (q && !inv.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [invitations, debouncedSearch, invStatusFilter]);

  const activeList = tab === 'active' ? filteredAdmins : filteredInvitations;
  const totalRows = activeList.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = activeList.slice((safePage - 1) * perPage, safePage * perPage);

  // Reset page on any filter / tab change.
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, roleFilter, mfaFilter, invStatusFilter, perPage]);

  const hasActiveFilter =
    search.length > 0 ||
    (tab === 'active' && (roleFilter !== 'all' || mfaFilter !== 'all')) ||
    (tab === 'invitations' && invStatusFilter !== 'all');

  const onClearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setMfaFilter('all');
    setInvStatusFilter('all');
  };

  // Handlers ────────────────────────────────────────────────────────
  const handleRevokeAdmin = (admin: AdminUserRecord) => {
    const uuid = admin.uuid ?? admin.id;
    revokeMutation.mutate(uuid);
  };

  const handleRevokeInvitation = (invitation: InvitationRecord) => {
    // Backend doesn't currently expose an invitation-revoke endpoint;
    // surface a toast and refresh so the user knows it's not destructive.
    showToast(t('action_revoke'), 'info');
    queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY });
    // Mark variable as used to satisfy noUnusedParameters.
    void invitation;
  };

  const handleInviteCreated = () => {
    queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY });
  };

  const refreshAll = () => {
    adminsQuery.refetch();
    invitationsQuery.refetch();
  };

  const isInitialLoading =
    (tab === 'active' && adminsQuery.isLoading) ||
    (tab === 'invitations' && invitationsQuery.isLoading);
  const error = tab === 'active' ? adminsQuery.error : invitationsQuery.error;
  const isFetching = adminsQuery.isFetching || invitationsQuery.isFetching;
  const isEmpty = !isInitialLoading && !error && pageRows.length === 0;

  return (
    <section className="space-y-4 md:space-y-6">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            aria-label={t('refresh')}
            title={t('refresh')}
            disabled={isFetching}
            className={cn(
              'inline-flex items-center justify-center h-9 w-9 rounded-md',
              'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
              'text-gray-500 dark:text-gray-400',
              'transition-colors duration-150',
              'hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
              'active:scale-95',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            <RefreshCw
              className={cn('h-4 w-4', isFetching && 'animate-spin')}
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-4 rounded-md',
              'bg-teal-700 hover:bg-teal-800 active:bg-teal-800',
              'text-sm font-semibold text-white',
              'transition-colors duration-150',
              'active:scale-[0.98]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
            <span className="hidden sm:inline">{t('invite').replace(/^\+\s*/, '')}</span>
            <span className="sm:hidden">{t('invite_short')}</span>
          </button>
        </div>
      </header>

      {/* KPI grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          iconColor="text-teal-700 dark:text-teal-400"
          iconBg="bg-teal-50 dark:bg-teal-500/15"
          label={t('stats_total')}
          value={String(totalAdmins)}
          hint={`${activeRecently} ${t('status_active').toLowerCase()}`}
        />
        <KpiCard
          icon={ShieldCheck}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          label={t('kpi_mfa_coverage')}
          value={`${mfaPct}%`}
          hint={`${mfaEnabled} / ${totalAdmins} ${t('mfa_enabled').toLowerCase()}`}
        />
        <KpiCard
          icon={Mail}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          label={t('stats_pending_invitations')}
          value={String(pendingInvitations)}
        />
        <KpiCard
          icon={Users}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-500/15"
          label={t('stats_active_sessions')}
          value={String(activeRecently)}
          hint={t('kpi_active_24h_hint')}
        />
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label={t('title')}
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 flex flex-wrap items-center gap-1.5"
      >
        <TabChip
          active={tab === 'active'}
          count={totalAdmins}
          onClick={() => setTab('active')}
          panelId="admins-panel-active"
        >
          {t('tab_active')}
        </TabChip>
        <TabChip
          active={tab === 'invitations'}
          count={pendingInvitations}
          onClick={() => setTab('invitations')}
          panelId="admins-panel-invitations"
        >
          {t('tab_invitations')}
        </TabChip>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-5 flex items-stretch sm:items-center gap-2 flex-col sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[240px]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          />
          <label htmlFor="admins-search" className="sr-only">
            {tab === 'active' ? t('search_active_placeholder') : t('search_invitations_placeholder')}
          </label>
          <input
            id="admins-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === 'active'
                ? t('search_active_placeholder')
                : t('search_invitations_placeholder')
            }
            autoComplete="off"
            className={cn(
              'h-9 w-full pl-8 pr-2.5 rounded-md',
              'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
              'text-sm text-gray-900 dark:text-white',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:border-teal-700 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 dark:focus:ring-teal-400/20',
            )}
          />
        </div>

        {tab === 'active' ? (
          <>
            <FilterSelect
              value={roleFilter}
              onChange={(v) => setRoleFilter(v as RoleFilter)}
              aria-label={t('th_role')}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? `${t('th_role')}: ${t('filter_all')}` : t(`role_${r}`)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={mfaFilter}
              onChange={(v) => setMfaFilter(v as MfaFilter)}
              aria-label="2FA"
            >
              <option value="all">2FA: {t('filter_all')}</option>
              <option value="enabled">{t('mfa_enabled')}</option>
              <option value="disabled">{t('mfa_disabled')}</option>
            </FilterSelect>
          </>
        ) : (
          <FilterSelect
            value={invStatusFilter}
            onChange={(v) => setInvStatusFilter(v as InvStatusFilter)}
            aria-label={t('th_invitation_status')}
          >
            <option value="all">
              {t('th_invitation_status')}: {t('filter_all')}
            </option>
            <option value="pending">{t('invitation_status_pending')}</option>
            <option value="expired">{t('invitation_status_expired')}</option>
            <option value="accepted">{t('invitation_status_accepted')}</option>
          </FilterSelect>
        )}

        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilter}
          className={cn(
            'inline-flex items-center justify-center h-9 px-3 rounded-md',
            'border border-gray-200 dark:border-gray-800 bg-transparent',
            'text-sm font-semibold text-gray-600 dark:text-gray-400',
            'transition-colors duration-150',
            'hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {t('filter_clear')}
        </button>
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={tab === 'active' ? 'admins-panel-active' : 'admins-panel-invitations'}
        aria-label={tab === 'active' ? t('tab_active') : t('tab_invitations')}
      >
        {error ? (
          <ErrorState
            title={t('error_title')}
            message={error instanceof Error ? error.message : String(error)}
            onRetry={refreshAll}
            retryLabel={t('retry')}
          />
        ) : isInitialLoading ? (
          <TableSkeleton />
        ) : isEmpty ? (
          tab === 'active' ? (
            <EmptyState
              title={hasActiveFilter ? t('no_active_admins_filtered') : t('no_active_admins')}
              subtitle={
                hasActiveFilter ? t('empty_clear_filters_subtitle') : t('empty_no_admins_subtitle')
              }
              icon="users"
              primaryCtaLabel={hasActiveFilter ? t('filter_clear') : t('invite_short')}
              onPrimaryCta={hasActiveFilter ? onClearFilters : () => setInviteOpen(true)}
            />
          ) : (
            <EmptyState
              title={hasActiveFilter ? t('no_invitations_filtered') : t('no_invitations')}
              subtitle={
                hasActiveFilter
                  ? t('empty_clear_filters_subtitle')
                  : t('empty_no_invitations_subtitle')
              }
              icon="mail"
              primaryCtaLabel={hasActiveFilter ? t('filter_clear') : t('invite_short')}
              onPrimaryCta={hasActiveFilter ? onClearFilters : () => setInviteOpen(true)}
            />
          )
        ) : tab === 'active' ? (
          <ActiveAdminsTable
            rows={pageRows as AdminUserRecord[]}
            currentUserId={currentUser?.id ?? null}
            onRevoke={handleRevokeAdmin}
            isRevoking={revokeMutation.isPending}
          />
        ) : (
          <InvitationsTable
            rows={pageRows as InvitationRecord[]}
            onRevoke={handleRevokeInvitation}
          />
        )}
      </div>

      {/* Pagination */}
      {!isInitialLoading && !error && !isEmpty ? (
        <TenantsPagination
          page={safePage}
          totalPages={totalPages}
          totalRows={totalRows}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      ) : null}

      <InviteAdminModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={handleInviteCreated}
      />

      <Toast
        open={toastState.open}
        message={toastState.message}
        variant={toastState.variant}
        onClose={closeToast}
      />
    </section>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

type TabChipProps = {
  active: boolean;
  count: number;
  onClick: () => void;
  panelId: string;
  children: React.ReactNode;
};

function TabChip({ active, count, onClick, panelId, children }: TabChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border',
        'text-[11px] font-semibold uppercase tracking-[0.04em]',
        'transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        active
          ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white active:scale-[0.98]',
      )}
    >
      {children}
      <span
        className={cn(
          'tabular-nums font-bold',
          active ? '' : 'text-gray-900 dark:text-white',
        )}
      >
        {count}
      </span>
    </button>
  );
}

type FilterSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange'
> & {
  onChange: (value: string) => void;
};

function FilterSelect({ onChange, children, className, ...rest }: FilterSelectProps) {
  return (
    <select
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 pl-2.5 pr-7 rounded-md cursor-pointer',
        'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        'text-sm font-medium text-gray-900 dark:text-white',
        'transition-colors duration-150',
        'focus:outline-none focus:border-teal-700 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 dark:focus:ring-teal-400/20',
        'w-full sm:w-auto',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

/** Skeleton matching the final table layout. */
function TableSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="h-9 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800" />
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 5 }, (_, idx) => (
          <li key={idx} className="px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-2.5 w-24 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-5 w-16 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-8 w-8 rounded-md animate-pulse bg-gray-200 dark:bg-gray-800" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  subtitle: string;
  icon: 'users' | 'mail';
  primaryCtaLabel: string;
  onPrimaryCta: () => void;
};

function EmptyState({ title, subtitle, icon, primaryCtaLabel, onPrimaryCta }: EmptyStateProps) {
  const Icon = icon === 'mail' ? Mail : UserPlus;
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-12 md:py-16 flex flex-col items-center justify-center gap-3 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon
          className="h-6 w-6 text-gray-500 dark:text-gray-400"
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {subtitle}
      </p>
      <button
        type="button"
        onClick={onPrimaryCta}
        className={cn(
          'mt-2 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md',
          'bg-teal-700 hover:bg-teal-800 active:bg-teal-800',
          'text-sm font-semibold text-white',
          'transition-colors duration-150',
          'active:scale-[0.98]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
        {primaryCtaLabel}
      </button>
    </div>
  );
}

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel: string;
};

function ErrorState({ title, message, onRetry, retryLabel }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-6 py-8 flex flex-col items-center justify-center gap-3 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
        <AlertCircle
          className="h-6 w-6 text-red-600 dark:text-red-400"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      <p className="text-sm font-semibold text-red-800 dark:text-red-300">{title}</p>
      <p className="max-w-md text-xs text-red-700/80 dark:text-red-300/80 break-words leading-relaxed">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'mt-2 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md',
          'border border-red-300 dark:border-red-500/40 bg-white dark:bg-gray-900',
          'text-sm font-semibold text-red-700 dark:text-red-300',
          'transition-colors duration-150',
          'hover:bg-red-100 dark:hover:bg-red-500/20',
          'active:scale-[0.98]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        )}
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
        {retryLabel}
      </button>
    </div>
  );
}
