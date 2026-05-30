'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Download,
  Inbox,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TenantsPagination, type PerPage } from '@/components/tenants/tenants-pagination';
import { cn } from '@/lib/cn';
import {
  fetchAuditActions,
  fetchAuditLogs,
  type AuditLogFilters,
  type AuditLogRecord,
} from '@/lib/api-helpers';
import { AuditDetailModal } from './audit-detail-modal';
import {
  AuditSeverityChips,
  computeSeverityCounts,
  type SeverityChipFilter,
} from './audit-severity-chips';
import { AuditTable, type SortColumn, type SortDir, type SortState } from './audit-table';

type ActorFilter = 'all' | AuditLogRecord['actor_type'];
type RangePreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'custom';

const DEFAULT_SORT = { column: 'timestamp' as SortColumn, dir: 'desc' as SortDir };

/** Threshold above which we render the action dropdown with a typeahead. */
const ACTION_TYPEAHEAD_THRESHOLD = 20;

const ACTORS: ReadonlyArray<ActorFilter> = ['all', 'user', 'super_admin', 'system', 'api'];

const RANGE_PRESETS: ReadonlyArray<RangePreset> = [
  'all',
  'today',
  'yesterday',
  '7d',
  '30d',
  'custom',
];

/** Translate a range preset into ISO `from` / `to` date strings (yyyy-MM-dd). */
function rangeToDates(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === 'all' || preset === 'custom') return { from: '', to: '' };
  if (preset === 'today') {
    return { from: iso(now), to: iso(now) };
  }
  if (preset === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: iso(yesterday), to: iso(yesterday) };
  }
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { from: iso(start), to: iso(now) };
  }
  if (preset === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { from: iso(start), to: iso(now) };
  }
  return { from: '', to: '' };
}

/**
 * Audit-log viewer wired to `/api/v1/super-admin/audit-logs`. The KPI
 * cards and severity chips are computed from the current page; pagination
 * and filters feed straight into the query key so refetch happens
 * automatically. Recent rapid filter changes briefly switch the live
 * indicator from `LIVE` to `PAUSED` to communicate the debounced refetch
 * state.
 */
export function AuditView() {
  const t = useTranslations('audit_page');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityChipFilter>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<ActorFilter>('all');
  const [rangePreset, setRangePreset] = useState<RangePreset>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(25);
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);
  /** Becomes true momentarily after rapid filter changes; clears when search settles. */
  const [pausedTick, setPausedTick] = useState(false);

  // Debounce search input — avoids one query per keystroke.
  useEffect(() => {
    if (search !== debouncedSearch) setPausedTick(true);
    const id = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPausedTick(false);
    }, 250);
    return () => window.clearTimeout(id);
  }, [search, debouncedSearch]);

  // Reset to page 1 on any filter change.
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    severityFilter,
    actionFilter,
    actorFilter,
    rangePreset,
    customFrom,
    customTo,
    perPage,
  ]);

  // Build the query filters object — what gets pushed to the backend.
  const queryFilters: AuditLogFilters = useMemo(() => {
    const filters: AuditLogFilters = { per_page: perPage, page };
    if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
    if (severityFilter !== 'all') filters.severity = severityFilter;
    if (actionFilter !== 'all') filters.action = actionFilter;
    if (actorFilter !== 'all') filters.actor = actorFilter;

    if (rangePreset === 'custom') {
      if (customFrom) filters.from = customFrom;
      if (customTo) filters.to = customTo;
    } else if (rangePreset !== 'all') {
      const { from, to } = rangeToDates(rangePreset);
      if (from) filters.from = from;
      if (to) filters.to = to;
    }

    return filters;
  }, [
    debouncedSearch,
    severityFilter,
    actionFilter,
    actorFilter,
    rangePreset,
    customFrom,
    customTo,
    page,
    perPage,
  ]);

  const logsQuery = useQuery({
    queryKey: ['super-admin', 'audit-logs', queryFilters],
    queryFn: () => fetchAuditLogs(queryFilters),
  });

  const actionsQuery = useQuery({
    queryKey: ['super-admin', 'audit-actions'],
    queryFn: fetchAuditActions,
  });

  const logs = useMemo<AuditLogRecord[]>(() => logsQuery.data?.data ?? [], [logsQuery.data]);
  const totalRows = logsQuery.data?.meta?.total ?? logs.length;
  const lastPage = logsQuery.data?.meta?.last_page ?? Math.max(1, Math.ceil(totalRows / perPage));
  const actionOptions = useMemo(() => actionsQuery.data ?? [], [actionsQuery.data]);

  // Severity chip counts from current page.
  const counts = useMemo(() => computeSeverityCounts(logs), [logs]);

  // 24-hour KPIs from current page (the backend should narrow further when wired).
  const last24Stats = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = logs.filter((l) => new Date(l.created_at).getTime() >= cutoff);
    const actors = new Set<string>();
    let critical = 0;
    let errors = 0;
    let warnings = 0;
    for (const log of recent) {
      if (log.actor_user_uuid) actors.add(log.actor_user_uuid);
      if (log.severity === 'critical') critical++;
      else if (log.severity === 'error') errors++;
      else if (log.severity === 'warning') warnings++;
    }
    return {
      total: recent.length,
      critical,
      errors_warnings: errors + warnings,
      actors: actors.size,
    };
  }, [logs]);

  // Client-side sort on the current page.
  const sortedRows = useMemo<AuditLogRecord[]>(() => {
    if (!sort) return logs;
    const SEV_RANK: Record<AuditLogRecord['severity'], number> = {
      debug: 0,
      info: 1,
      warning: 2,
      error: 3,
      critical: 4,
    };
    const copy = [...logs];
    const mul = sort.dir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      if (sort.column === 'timestamp') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mul;
      }
      if (sort.column === 'severity') {
        return (SEV_RANK[a.severity] - SEV_RANK[b.severity]) * mul;
      }
      return 0;
    });
    return copy;
  }, [logs, sort]);

  const hasActiveFilter =
    debouncedSearch !== '' ||
    severityFilter !== 'all' ||
    actionFilter !== 'all' ||
    actorFilter !== 'all' ||
    rangePreset !== 'all' ||
    customFrom !== '' ||
    customTo !== '' ||
    sort?.column !== DEFAULT_SORT.column ||
    sort?.dir !== DEFAULT_SORT.dir;

  const clearFilters = () => {
    setSearch('');
    setSeverityFilter('all');
    setActionFilter('all');
    setActorFilter('all');
    setRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setSort(DEFAULT_SORT);
  };

  const onSortClick = (column: SortColumn) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) {
        return { column, dir: 'desc' };
      }
      return { column, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  const useActionTypeahead = actionOptions.length > ACTION_TYPEAHEAD_THRESHOLD;
  const isLoading = logsQuery.isLoading;
  const error = logsQuery.error;
  const isLive = !pausedTick && !logsQuery.isFetching;

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <LiveIndicator live={isLive} t={t} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => logsQuery.refetch()}
              aria-label={t('refresh')}
              title={t('refresh')}
              disabled={logsQuery.isFetching}
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
                className={cn('h-4 w-4', logsQuery.isFetching && 'animate-spin')}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              aria-label={t('export_csv_aria')}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3 rounded-md',
                'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-white text-sm font-semibold',
                'transition-colors duration-150',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'active:scale-[0.98]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              )}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden sm:inline">{t('export_csv')}</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* KPI grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Activity}
          iconColor="text-teal-700 dark:text-teal-400"
          iconBg="bg-teal-50 dark:bg-teal-500/15"
          label={t('kpi_24h_activity')}
          value={String(last24Stats.total)}
          hint={t('kpi_24h_activity_hint')}
        />
        <KpiCard
          icon={ShieldAlert}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-50 dark:bg-red-500/15"
          label={t('kpi_24h_critical')}
          value={String(last24Stats.critical)}
          hint={t('kpi_24h_critical_hint')}
        />
        <KpiCard
          icon={AlertTriangle}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-500/15"
          label={t('kpi_24h_errors_warnings')}
          value={String(last24Stats.errors_warnings)}
          hint={t('kpi_24h_critical_hint')}
        />
        <KpiCard
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          label={t('kpi_24h_actors')}
          value={String(last24Stats.actors)}
          hint={t('kpi_24h_actors_hint')}
        />
      </div>

      {/* Severity chips */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 md:px-5 md:py-3.5">
        <AuditSeverityChips
          current={severityFilter}
          onChange={setSeverityFilter}
          counts={counts}
        />
      </div>

      {/* Filters card */}
      <div className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-5">
        {/* Range preset chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400 pr-1">
            {t('range_label')}:
          </span>
          {RANGE_PRESETS.map((r) => {
            const isActive = rangePreset === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={isActive}
                onClick={() => setRangePreset(r)}
                className={cn(
                  'px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-[0.04em]',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                  isActive
                    ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white active:scale-[0.98]',
                )}
              >
                {t(`range_${r}`)}
              </button>
            );
          })}
          {rangePreset === 'custom' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <DateInput
                value={customFrom}
                onChange={setCustomFrom}
                aria-label={t('filter_from')}
                title={t('filter_from')}
              />
              <span
                className="text-gray-500 dark:text-gray-400 text-xs font-bold select-none"
                aria-hidden="true"
              >
                →
              </span>
              <DateInput
                value={customTo}
                onChange={setCustomTo}
                aria-label={t('filter_to')}
                title={t('filter_to')}
              />
            </div>
          ) : null}
        </div>

        {/* Search + filter selects */}
        <div className="flex items-stretch sm:items-center gap-2 flex-col sm:flex-row sm:flex-wrap">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            />
            <label htmlFor="audit-search" className="sr-only">
              {t('search_placeholder')}
            </label>
            <input
              id="audit-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
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

          {useActionTypeahead ? (
            <ActionTypeahead
              value={actionFilter}
              onChange={setActionFilter}
              options={actionOptions}
              labelAll={`${t('filter_action')}: ${t('filter_all')}`}
            />
          ) : (
            <FilterSelect
              value={actionFilter}
              onChange={setActionFilter}
              aria-label={t('filter_action')}
            >
              <option value="all">
                {t('filter_action')}: {t('filter_all')}
              </option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </FilterSelect>
          )}

          <FilterSelect
            value={actorFilter}
            onChange={(v) => setActorFilter(v as ActorFilter)}
            aria-label={t('filter_actor_type')}
          >
            {ACTORS.map((v) => (
              <option key={v} value={v}>
                {v === 'all'
                  ? `${t('filter_actor_type')}: ${t('filter_all')}`
                  : t(`actor_type_${v}` as const)}
              </option>
            ))}
          </FilterSelect>
          <button
            type="button"
            onClick={clearFilters}
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
      </div>

      {/* Table / loading / error / empty */}
      {error ? (
        <ErrorState
          title={t('error_title')}
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => logsQuery.refetch()}
          retryLabel={t('retry')}
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : sortedRows.length === 0 ? (
        <EmptyState
          title={t('no_logs')}
          subtitle={t('empty_subtitle')}
          ctaLabel={hasActiveFilter ? t('empty_clear_filters') : null}
          onCta={hasActiveFilter ? clearFilters : undefined}
        />
      ) : (
        <AuditTable
          rows={sortedRows}
          onRowClick={(entry) => setSelected(entry)}
          sort={sort}
          onSortChange={onSortClick}
        />
      )}

      {/* Pagination */}
      {!isLoading && !error ? (
        <TenantsPagination
          page={page}
          totalPages={lastPage}
          totalRows={totalRows}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      ) : null}

      <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

type LiveIndicatorProps = {
  live: boolean;
  t: ReturnType<typeof useTranslations>;
};

/** Pill-shaped live/paused indicator with a pulsing dot. */
function LiveIndicator({ live, t }: LiveIndicatorProps) {
  return (
    <span
      aria-live="polite"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md',
        'text-[11px] font-bold uppercase tracking-[0.05em] tabular-nums whitespace-nowrap',
        'transition-colors duration-200',
        live
          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
      )}
    >
      <span className="relative flex h-[7px] w-[7px]" aria-hidden="true">
        {live ? (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-gray-400 dark:bg-gray-600" />
        )}
      </span>
      {live ? t('live') : t('paused')}
    </span>
  );
}

type FilterSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange'
> & {
  onChange: (value: string) => void;
};

/** Compact filter <select> matching the search input height. */
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

type DateInputProps = {
  value: string;
  onChange: (next: string) => void;
  'aria-label': string;
  title?: string;
};

function DateInput({ value, onChange, ...rest }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 px-2 rounded-md',
        'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        'text-sm font-medium text-gray-900 dark:text-white',
        'transition-colors duration-150',
        'focus:outline-none focus:border-teal-700 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 dark:focus:ring-teal-400/20',
      )}
      {...rest}
    />
  );
}

type ActionTypeaheadProps = {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  labelAll: string;
};

/**
 * Combobox-style action filter — a free-text input feeds a `<datalist>`
 * so the browser provides typeahead suggestions while keeping the
 * dependency surface minimal.
 */
function ActionTypeahead({ value, onChange, options, labelAll }: ActionTypeaheadProps) {
  const displayValue = value === 'all' ? '' : value;
  const t = useTranslations('audit_page');

  return (
    <div className="relative w-full sm:w-auto">
      <label htmlFor="audit-action-input" className="sr-only">
        {t('filter_action')}
      </label>
      <input
        id="audit-action-input"
        list="audit-actions-list"
        value={displayValue}
        onChange={(e) => onChange(e.target.value || 'all')}
        placeholder={labelAll}
        className={cn(
          'h-9 pl-2.5 pr-7 rounded-md w-full sm:w-[200px]',
          'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
          'text-sm font-medium text-gray-900 dark:text-white',
          'placeholder:text-gray-500 dark:placeholder:text-gray-400',
          'transition-colors duration-150',
          'focus:outline-none focus:border-teal-700 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 dark:focus:ring-teal-400/20',
        )}
      />
      <datalist id="audit-actions-list">
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

/** Audit-table skeleton matching the final layout (header + 6 rows). */
function TableSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="h-9 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800" />
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 6 }, (_, idx) => (
          <li key={idx} className="px-3 py-3 space-y-2 border-l-[3px] border-l-gray-200 dark:border-l-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-3 w-24 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-20 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-40 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-4 w-32 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  subtitle: string;
  ctaLabel?: string | null;
  onCta?: () => void;
};

/** Centred empty state with optional secondary CTA. */
function EmptyState({ title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-12 md:py-16 flex flex-col items-center justify-center gap-3 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Inbox
          className="h-6 w-6 text-gray-500 dark:text-gray-400"
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {subtitle}
      </p>
      {ctaLabel && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className={cn(
            'mt-2 inline-flex items-center justify-center h-9 px-3 rounded-md',
            'border border-teal-200 dark:border-teal-500/40 bg-teal-50 dark:bg-teal-500/15',
            'text-sm font-semibold text-teal-700 dark:text-teal-300',
            'transition-colors duration-150',
            'hover:bg-teal-100 dark:hover:bg-teal-500/25',
            'active:scale-[0.98]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
          )}
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel: string;
};

/** Compact error card with retry button + alert icon. */
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
