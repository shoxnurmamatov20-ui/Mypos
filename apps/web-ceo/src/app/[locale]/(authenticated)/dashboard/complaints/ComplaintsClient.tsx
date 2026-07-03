'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Inbox,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import {
  buildComplaintsQuery,
  type ComplaintFilters,
  type ComplaintRegionsResponse,
  type ComplaintSeverity,
  type ComplaintShowResponse,
  type ComplaintStatus,
  type ComplaintSummary,
  type ComplaintsResponse,
  ceoFetch,
  ceoMutate,
} from '@/lib/api';
import { ComplaintDetailDrawer } from './_components/detail-drawer';
import { FilterBar } from './_components/filter-bar';
import { StatTile } from './_components/stat-tile';
import { ComplaintsTable } from './_components/table';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

const STATUSES: ComplaintStatus[] = ['open', 'in_review', 'resolved', 'escalated'];
const SEVERITIES: ComplaintSeverity[] = ['low', 'medium', 'high', 'urgent'];

const DEFAULT_FILTERS: ComplaintFilters = {
  q: '',
  status: '',
  severity: '',
  region: '',
  urgent: false,
  stale: false,
  sort: 'created_at',
  dir: 'desc',
  per: 25,
  page: 1,
};

export function ComplaintsClient({ locale }: { locale: string }) {
  const t = useTranslations('complaints');
  const [filters, setFilters] = useState<ComplaintFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<ComplaintsResponse | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ceoFetch<ComplaintsResponse>(`/api/v1/ceo/complaints${buildComplaintsQuery(filters)}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Drop any selections that are no longer on this page.
        setSelected((prev) => {
          const ids = new Set(res.data.map((c) => c.id));
          const next = new Set<number>();
          for (const id of prev) if (ids.has(id)) next.add(id);
          return next;
        });
      })
      .catch((e) => {
        if (cancelled) return;
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setError(t('error_load'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, locale, reloadKey, t]);

  useEffect(() => {
    let cancelled = false;
    ceoFetch<ComplaintRegionsResponse>('/api/v1/ceo/complaints/regions')
      .then((res) => {
        if (!cancelled) setRegions(res.data);
      })
      .catch(() => {
        /* non-fatal — region dropdown will just be empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFilters = useCallback((patch: Partial<ComplaintFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const totalSelected = selected.size;
  const allOnPageSelected = useMemo(() => {
    if (!data || data.data.length === 0) return false;
    return data.data.every((c) => selected.has(c.id));
  }, [data, selected]);

  const toggleRow = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(() => {
    if (!data) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = data.data.every((c) => next.has(c.id));
      if (allOn) {
        for (const c of data.data) next.delete(c.id);
      } else {
        for (const c of data.data) next.add(c.id);
      }
      return next;
    });
  }, [data]);

  const onStatusInline = useCallback(
    async (id: number, status: ComplaintStatus) => {
      try {
        await ceoMutate<ComplaintShowResponse>(`/api/v1/ceo/complaints/${id}`, 'PATCH', {
          status,
        });
        reload();
      } catch {
        setError(t('error_save'));
      }
    },
    [reload, t],
  );

  const onBulk = useCallback(
    async (
      action: 'set_status' | 'mark_urgent' | 'unmark_urgent' | 'delete',
      status?: ComplaintStatus,
    ) => {
      const ids = [...selected];
      if (ids.length === 0) return;
      if (!confirm(t('bulk_confirm', { count: ids.length }))) return;
      try {
        await ceoMutate<{ data: { touched: number } }>('/api/v1/ceo/complaints/bulk', 'POST', {
          action,
          ids,
          status: status ?? null,
        });
        setSelected(new Set());
        reload();
      } catch {
        setError(t('error_save'));
      }
    },
    [selected, reload, t],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          data ? (
            <span className="inline-flex items-center rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-2.5 h-8 text-[12px] font-bold tabular-nums text-[#16221f] dark:text-white">
              {t('count', { count: data.meta.total })}
            </span>
          ) : undefined
        }
      />

      {/* Stat tiles — 4-up on lg, 2-up on small */}
      <SummaryGrid summary={data?.summary} t={t} />

      <FilterBar
        filters={filters}
        statuses={STATUSES}
        severities={SEVERITIES}
        regions={regions}
        onChange={updateFilters}
        onReset={resetFilters}
        t={t}
      />

      {/* Bulk action bar — only when something selected */}
      {totalSelected > 0 ? (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 shadow-sm">
          <span className="text-[12px] font-bold text-blue-900 dark:text-blue-200">
            {t('bulk_selected', { count: totalSelected })}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <select
              className="h-8 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-[#0b1120] px-2 text-[12px] text-[#16221f] dark:text-white"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = '';
                if (!v) return;
                if (v === 'mark_urgent' || v === 'unmark_urgent' || v === 'delete') {
                  void onBulk(v);
                } else if (STATUSES.includes(v as ComplaintStatus)) {
                  void onBulk('set_status', v as ComplaintStatus);
                }
              }}
            >
              <option value="" disabled>
                {t('bulk_apply')}
              </option>
              <optgroup label={t('bulk_set_status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </optgroup>
              <option value="mark_urgent">{t('bulk_mark_urgent')}</option>
              <option value="unmark_urgent">{t('bulk_unmark_urgent')}</option>
              <option value="delete">{t('bulk_delete')}</option>
            </select>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="h-8 inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-[#0b1120] px-2.5 text-[12px] font-semibold text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              <X className="w-3.5 h-3.5" /> {t('bulk_cancel')}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Table */}
      <ComplaintsTable
        rows={data?.data ?? []}
        loading={loading && !data}
        selected={selected}
        allOnPageSelected={allOnPageSelected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAllOnPage}
        onOpenDetail={(id) => setActiveDetailId(id)}
        onInlineStatus={onStatusInline}
        statuses={STATUSES}
        t={t}
      />

      {/* Empty */}
      {!loading && data && data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
          <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
          <p className="text-[13px]">{t('empty')}</p>
        </div>
      ) : null}

      {/* Pagination */}
      {data && data.meta.last_page > 1 ? (
        <div className="flex items-center justify-between text-[12px] text-[#62716d] dark:text-[#94a3b8]">
          <button
            type="button"
            disabled={data.meta.current_page <= 1}
            onClick={() => updateFilters({ page: data.meta.current_page - 1 })}
            className="h-8 px-3 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('page_prev')}
          </button>
          <span className="tabular-nums font-semibold text-[#16221f] dark:text-white">
            {t('page_of', { current: data.meta.current_page, total: data.meta.last_page })}
          </span>
          <button
            type="button"
            disabled={data.meta.current_page >= data.meta.last_page}
            onClick={() => updateFilters({ page: data.meta.current_page + 1 })}
            className="h-8 px-3 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('page_next')}
          </button>
        </div>
      ) : null}

      <ComplaintDetailDrawer
        complaintId={activeDetailId}
        onClose={() => setActiveDetailId(null)}
        onSaved={() => {
          setActiveDetailId(null);
          reload();
        }}
        statuses={STATUSES}
        severities={SEVERITIES}
        t={t}
      />
    </div>
  );
}

function SummaryGrid({
  summary,
  t,
}: {
  summary: ComplaintSummary | undefined;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatTile accent="amber" icon={Inbox} label={t('stat_open')} value={summary?.open ?? 0} />
      <StatTile
        accent="blue"
        icon={Clock}
        label={t('stat_in_review')}
        value={summary?.in_review ?? 0}
      />
      <StatTile
        accent="emerald"
        icon={CheckCircle2}
        label={t('stat_resolved')}
        value={summary?.resolved ?? 0}
      />
      <StatTile accent="red" icon={Flame} label={t('stat_urgent')} value={summary?.urgent ?? 0} />
      <StatTile
        accent="orange"
        icon={AlertTriangle}
        label={t('stat_stale')}
        value={summary?.stale ?? 0}
      />
      <StatTile
        accent="violet"
        icon={TrendingUp}
        label={t('stat_escalated')}
        value={summary?.escalated ?? 0}
      />
      <StatTile accent="slate" icon={Filter} label={t('stat_total')} value={summary?.total ?? 0} />
      <StatTile
        accent="teal"
        icon={Search}
        label={t('stat_avg_resolution')}
        value={summary?.avg_resolution_hours ?? 0}
        decimals={1}
      />
    </div>
  );
}
