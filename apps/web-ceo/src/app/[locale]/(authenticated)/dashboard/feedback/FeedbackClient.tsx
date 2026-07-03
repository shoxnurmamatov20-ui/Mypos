'use client';

import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  MessageSquare,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/layout/page-header';
import {
  buildFeedbackQuery,
  ceoFetch,
  ceoMutate,
  type FeedbackDetail,
  type FeedbackDetailResponse,
  type FeedbackListResponse,
  type FeedbackQuery,
  type FeedbackRestaurantsResponse,
  type FeedbackRow,
  type FeedbackStats,
  type FeedbackStatsResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type LoadState<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: T };

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5] as const;
const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const HAS_COMMENT_OPTIONS = [
  { value: '' as const, key: 'comment_any' },
  { value: '1' as const, key: 'comment_only' },
  { value: '0' as const, key: 'comment_none' },
];

export function FeedbackClient({ locale }: { locale: string }) {
  const t = useTranslations('feedback');

  const [page, setPage] = useState(1);
  const [per, setPer] = useState<number>(25);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tenantId, setTenantId] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [hasComment, setHasComment] = useState<'' | '1' | '0'>('');
  const [sort, setSort] = useState<'created_at' | 'rating'>('created_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const [list, setList] = useState<LoadState<FeedbackListResponse>>({ kind: 'loading' });
  const [stats, setStats] = useState<LoadState<FeedbackStats>>({ kind: 'loading' });
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
  );
  const [selected, setSelected] = useState<FeedbackDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const query: FeedbackQuery = useMemo(
    () => ({
      page,
      per,
      q: q || undefined,
      tenant_id: tenantId || undefined,
      rating: rating > 0 ? rating : undefined,
      has_comment: hasComment || undefined,
      sort,
      dir,
    }),
    [page, per, q, tenantId, rating, hasComment, sort, dir],
  );

  const reload = useCallback(() => {
    setList({ kind: 'loading' });
    ceoFetch<FeedbackListResponse>(`/api/v1/ceo/feedback${buildFeedbackQuery(query)}`)
      .then((res) => setList({ kind: 'success', data: res }))
      .catch((e) => {
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setList({ kind: 'error', message: String(e) });
      });

    ceoFetch<FeedbackStatsResponse>(
      `/api/v1/ceo/feedback/stats${buildFeedbackQuery({
        tenant_id: tenantId || undefined,
      })}`,
    )
      .then((res) => setStats({ kind: 'success', data: res.data }))
      .catch((e) => setStats({ kind: 'error', message: String(e) }));
  }, [query, tenantId, locale]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    ceoFetch<FeedbackRestaurantsResponse>('/api/v1/ceo/feedback/restaurants')
      .then((res) => setRestaurants(res.data))
      .catch(() => setRestaurants([]));
  }, []);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput('');
    setQ('');
    setTenantId('');
    setRating(0);
    setHasComment('');
    setPage(1);
  };

  const openDetail = (id: string) => {
    setSelectedLoading(true);
    ceoFetch<FeedbackDetailResponse>(`/api/v1/ceo/feedback/${id}`)
      .then((res) => setSelected(res.data))
      .catch(() => setSelected(null))
      .finally(() => setSelectedLoading(false));
  };

  const confirmDelete = (id: string) => setPendingDelete(id);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await ceoMutate<{ data: { deleted: boolean } }>(
        `/api/v1/ceo/feedback/${pendingDelete}`,
        'DELETE',
      );
      setPendingDelete(null);
      setSelected(null);
      reload();
    } catch {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-3.5">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          list.kind === 'success' ? (
            <span className="inline-flex items-center rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-2.5 h-8 text-[12px] font-bold tabular-nums text-[#16221f] dark:text-white">
              {t('count', { count: list.data.meta.total })}
            </span>
          ) : undefined
        }
      />

      {/* KPI row */}
      <StatsRow stats={stats} t={t} />

      {/* Rating distribution */}
      <DistributionCard stats={stats} t={t} />

      {/* Filter bar */}
      <FilterBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSubmit={onSearchSubmit}
        tenantId={tenantId}
        setTenantId={(v) => {
          setTenantId(v);
          setPage(1);
        }}
        restaurants={restaurants}
        rating={rating}
        setRating={(v) => {
          setRating(v);
          setPage(1);
        }}
        hasComment={hasComment}
        setHasComment={(v) => {
          setHasComment(v);
          setPage(1);
        }}
        resetFilters={resetFilters}
        t={t}
      />

      {/* List */}
      <FeedbackTable
        state={list}
        sort={sort}
        dir={dir}
        onSortChange={(s, d) => {
          setSort(s);
          setDir(d);
        }}
        onOpen={openDetail}
        onDelete={confirmDelete}
        t={t}
      />

      {/* Pagination */}
      {list.kind === 'success' && list.data.meta.total > 0 ? (
        <Pagination
          page={list.data.meta.page}
          pages={list.data.meta.pages}
          per={per}
          total={list.data.meta.total}
          onPage={setPage}
          onPer={(p) => {
            setPer(p);
            setPage(1);
          }}
          t={t}
        />
      ) : null}

      {/* Detail drawer */}
      {selected || selectedLoading ? (
        <DetailDrawer
          loading={selectedLoading}
          review={selected}
          onClose={() => {
            setSelected(null);
            setSelectedLoading(false);
          }}
          onDelete={(id) => confirmDelete(id)}
          t={t}
        />
      ) : null}

      {/* Delete confirm */}
      {pendingDelete ? (
        <DeleteModal onCancel={() => setPendingDelete(null)} onConfirm={handleDelete} t={t} />
      ) : null}
    </div>
  );
}

function StatsRow({
  stats,
  t,
}: {
  stats: LoadState<FeedbackStats>;
  t: ReturnType<typeof useTranslations>;
}) {
  if (stats.kind === 'loading') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-[112px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (stats.kind === 'error') return null;
  const s = stats.data;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard
        icon={MessageSquare}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-950/40"
        label={t('kpi_total')}
        value={s.total.toString()}
        hint={t('kpi_total_hint')}
      />
      <KpiCard
        icon={Star}
        iconColor="text-amber-600 dark:text-amber-400"
        iconBg="bg-amber-50 dark:bg-amber-950/40"
        label={t('kpi_avg_rating')}
        value={s.avg_rating ? s.avg_rating.toFixed(2) : '—'}
        hint={t('kpi_avg_rating_hint')}
      />
      <KpiCard
        icon={ThumbsUp}
        iconColor="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        label={t('kpi_positive')}
        value={s.positive_count.toString()}
        hint={t('kpi_positive_hint')}
      />
      <KpiCard
        icon={ThumbsDown}
        iconColor="text-rose-600 dark:text-rose-400"
        iconBg="bg-rose-50 dark:bg-rose-950/40"
        label={t('kpi_negative')}
        value={s.negative_count.toString()}
        hint={t('kpi_negative_hint')}
      />
    </div>
  );
}

function DistributionCard({
  stats,
  t,
}: {
  stats: LoadState<FeedbackStats>;
  t: ReturnType<typeof useTranslations>;
}) {
  if (stats.kind !== 'success') return null;
  const s = stats.data;
  const max = Math.max(1, ...s.distribution.map((d) => d.count));

  return (
    <section className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-base font-semibold text-[#16221f] dark:text-white">
          {t('distribution_title')}
        </h3>
        <span className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
          {t('distribution_hint')}
        </span>
      </div>
      <div className="space-y-2">
        {s.distribution.map((d) => {
          const pct = max > 0 ? (d.count / max) * 100 : 0;
          const colour =
            d.rating >= 4 ? 'bg-emerald-500' : d.rating === 3 ? 'bg-amber-500' : 'bg-rose-500';
          return (
            <div key={d.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12 text-[12px] tabular-nums font-semibold text-[#16221f] dark:text-white">
                {d.rating}
                <Star className="h-3 w-3 fill-current text-amber-400" />
              </div>
              <div className="flex-1 h-2 rounded-full bg-[#f3f4f6] dark:bg-[#1a2235] overflow-hidden">
                <div
                  className={cn('h-full transition-[width] duration-500', colour)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-14 text-right text-[12px] tabular-nums font-bold text-[#16221f] dark:text-white">
                {d.count}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FilterBar({
  searchInput,
  setSearchInput,
  onSubmit,
  tenantId,
  setTenantId,
  restaurants,
  rating,
  setRating,
  hasComment,
  setHasComment,
  resetFilters,
  t,
}: {
  searchInput: string;
  setSearchInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  tenantId: string;
  setTenantId: (v: string) => void;
  restaurants: Array<{ id: string; name: string; slug: string }>;
  rating: number;
  setRating: (v: number) => void;
  hasComment: '' | '1' | '0';
  setHasComment: (v: '' | '1' | '0') => void;
  resetFilters: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-3 sm:p-4 flex flex-wrap items-center gap-2">
      <form onSubmit={onSubmit} className="flex-1 min-w-[200px] flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#62716d] dark:text-[#94a3b8]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0b1120] text-[13px] text-[#16221f] dark:text-white placeholder:text-[#62716d] focus:border-blue-500 focus:outline-none"
          />
        </div>
      </form>

      <select
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
        className="h-9 px-2.5 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0b1120] text-[12px] font-semibold text-[#16221f] dark:text-white"
        aria-label={t('filter_restaurant')}
      >
        <option value="">{t('filter_restaurant_all')}</option>
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <div className="inline-flex rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] overflow-hidden">
        {RATING_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={cn(
              'h-9 min-w-[34px] px-2 text-[12px] font-bold tabular-nums transition-colors',
              rating === n
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                : 'bg-white dark:bg-[#0b1120] text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white',
            )}
            aria-pressed={rating === n}
          >
            {n === 0 ? t('filter_rating_all') : `${n}★`}
          </button>
        ))}
      </div>

      <select
        value={hasComment}
        onChange={(e) => setHasComment(e.target.value as '' | '1' | '0')}
        className="h-9 px-2.5 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0b1120] text-[12px] font-semibold text-[#16221f] dark:text-white"
        aria-label={t('filter_comment')}
      >
        {HAS_COMMENT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.key)}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={resetFilters}
        className="h-9 px-3 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:bg-gray-50 dark:hover:bg-[#1a2235]"
      >
        {t('filter_reset')}
      </button>
    </section>
  );
}

function FeedbackTable({
  state,
  sort,
  dir,
  onSortChange,
  onOpen,
  onDelete,
  t,
}: {
  state: LoadState<FeedbackListResponse>;
  sort: 'created_at' | 'rating';
  dir: 'asc' | 'desc';
  onSortChange: (sort: 'created_at' | 'rating', dir: 'asc' | 'desc') => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (state.kind === 'loading') {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-[68px] rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
        {state.message}
      </div>
    );
  }

  const { data } = state;
  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
        <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <p className="text-[13px]">{t('empty')}</p>
      </div>
    );
  }

  const toggleSort = (column: 'created_at' | 'rating') => {
    if (sort === column) {
      onSortChange(column, dir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'desc');
    }
  };

  return (
    <section className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-[#f8fafc] dark:bg-[#1a2235]">
            <tr className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
              <th className="text-left px-4 py-2.5 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('rating')}
                  className="inline-flex items-center gap-1 hover:text-[#16221f] dark:hover:text-white"
                >
                  {t('th_rating')}
                  {sort === 'rating' ? <span aria-hidden>{dir === 'asc' ? '▲' : '▼'}</span> : null}
                </button>
              </th>
              <th className="text-left px-4 py-2.5 font-bold">{t('th_restaurant')}</th>
              <th className="text-left px-4 py-2.5 font-bold">{t('th_customer')}</th>
              <th className="text-left px-4 py-2.5 font-bold">{t('th_order')}</th>
              <th className="text-left px-4 py-2.5 font-bold">{t('th_comment')}</th>
              <th className="text-left px-4 py-2.5 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('created_at')}
                  className="inline-flex items-center gap-1 hover:text-[#16221f] dark:hover:text-white"
                >
                  {t('th_created')}
                  {sort === 'created_at' ? (
                    <span aria-hidden>{dir === 'asc' ? '▲' : '▼'}</span>
                  ) : null}
                </button>
              </th>
              <th className="text-right px-4 py-2.5 font-bold">{t('th_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((r) => (
              <Row key={r.id} r={r} onOpen={onOpen} onDelete={onDelete} t={t} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({
  r,
  onOpen,
  onDelete,
  t,
}: {
  r: FeedbackRow;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <tr className="border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)] hover:bg-[#f8fafc] dark:hover:bg-[#1a2235]">
      <td className="px-4 py-3">
        <RatingStars value={r.rating} />
      </td>
      <td className="px-4 py-3 text-[#16221f] dark:text-white">
        {r.restaurant ?? <span className="text-[#62716d]">—</span>}
      </td>
      <td className="px-4 py-3 text-[#16221f] dark:text-white">
        {r.customer_name ?? r.customer_phone ?? (
          <span className="text-[#62716d]">{t('guest')}</span>
        )}
      </td>
      <td className="px-4 py-3 text-[#62716d] dark:text-[#94a3b8] tabular-nums">
        {r.order_no ?? '—'}
      </td>
      <td className="px-4 py-3 max-w-[300px] truncate text-[#16221f] dark:text-white">
        {r.comment ? r.comment : <span className="text-[#62716d]">—</span>}
      </td>
      <td className="px-4 py-3 text-[#62716d] dark:text-[#94a3b8] tabular-nums whitespace-nowrap">
        {r.created_at_label ?? '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={() => onOpen(r.id)}
            className="h-7 px-2.5 rounded-md text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            {t('action_view')}
          </button>
          <button
            type="button"
            onClick={() => onDelete(r.id)}
            className="h-7 px-2 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            aria-label={t('action_delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 tabular-nums">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-3.5 w-3.5',
            n <= value ? 'fill-amber-400 text-amber-400' : 'text-[#d1d5db] dark:text-[#374151]',
          )}
        />
      ))}
      <span className="ml-1.5 text-[12px] font-bold text-[#16221f] dark:text-white">{value}</span>
    </div>
  );
}

function Pagination({
  page,
  pages,
  per,
  total,
  onPage,
  onPer,
  t,
}: {
  page: number;
  pages: number;
  per: number;
  total: number;
  onPage: (p: number) => void;
  onPer: (p: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const start = (page - 1) * per + 1;
  const end = Math.min(page * per, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
        {t('pagination_range', { start, end, total })}
      </p>
      <div className="flex items-center gap-3">
        <select
          value={per}
          onChange={(e) => onPer(Number(e.target.value))}
          className="h-8 px-2 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[12px] font-semibold text-[#16221f] dark:text-white tabular-nums"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-8 w-8 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[#16221f] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#1a2235]"
            aria-label={t('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-[12px] tabular-nums font-semibold text-[#16221f] dark:text-white">
            {page} / {pages}
          </span>
          <button
            type="button"
            onClick={() => onPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="h-8 w-8 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[#16221f] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#1a2235]"
            aria-label={t('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({
  loading,
  review,
  onClose,
  onDelete,
  t,
}: {
  loading: boolean;
  review: FeedbackDetail | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 bg-black/40 backdrop-blur-[2px]"
        aria-label={t('close')}
      />
      <aside className="w-full max-w-md h-full bg-white dark:bg-[#0b1120] border-l border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex flex-col">
        <header className="px-5 py-4 border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#16221f] dark:text-white">
            {t('detail_title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-[#1a2235] flex items-center justify-center text-[#62716d] dark:text-[#94a3b8]"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading || !review ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-[72px] rounded-xl bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <RatingStars value={review.rating} />
              </div>
              <DetailField label={t('detail_restaurant')} value={review.restaurant} />
              <DetailField
                label={t('detail_customer')}
                value={review.customer?.name ?? review.customer?.phone ?? t('guest')}
              />
              {review.order ? (
                <DetailField label={t('detail_order')} value={`#${review.order.order_no}`} />
              ) : null}
              {review.food_rating !== null ? (
                <DetailField label={t('detail_food_rating')} value={`${review.food_rating} / 5`} />
              ) : null}
              {review.delivery_rating !== null ? (
                <DetailField
                  label={t('detail_delivery_rating')}
                  value={`${review.delivery_rating} / 5`}
                />
              ) : null}
              {review.comment ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] mb-1">
                    {t('detail_comment')}
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#16221f] dark:text-white p-3 rounded-lg bg-[#f8fafc] dark:bg-[#111827] whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>
              ) : null}
              <DetailField
                label={t('detail_created')}
                value={review.created_at?.replace('T', ' ').slice(0, 16) ?? '—'}
              />
            </>
          )}
        </div>
        {review ? (
          <footer className="px-5 py-3 border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onDelete(review.id)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-[13px] font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('action_delete')}
            </button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] mb-0.5">
        {label}
      </p>
      <p className="text-[13px] text-[#16221f] dark:text-white tabular-nums">{value ?? '—'}</p>
    </div>
  );
}

function DeleteModal({
  onCancel,
  onConfirm,
  t,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] p-5 shadow-2xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
        <h3 className="text-[15px] font-semibold text-[#16221f] dark:text-white mb-1">
          {t('delete_confirm_title')}
        </h3>
        <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8] mb-4">
          {t('delete_confirm_body')}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-3 rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] text-[13px] font-semibold text-[#16221f] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a2235]"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-3 rounded-lg bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
