'use client';

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Inbox,
  Link as LinkIcon,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import {
  ceoFetch,
  ceoSend,
  type VisitTokenCreated,
  type VisitTokenOptionsResponse,
  type VisitTokenRow,
  type VisitTokenStatus,
  type VisitTokensListResponse,
} from '@/lib/api';
import { cn } from '@/lib/cn';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type Filters = {
  q: string;
  tenant: string;
  category: string;
  table: string;
  status: '' | VisitTokenStatus;
};

type Options = VisitTokenOptionsResponse['data'];

const EMPTY_FILTERS: Filters = { q: '', tenant: '', category: '', table: '', status: '' };

export function TokensClient({ locale }: { locale: string }) {
  const t = useTranslations('tokens');

  const [list, setList] = useState<VisitTokensListResponse | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  // List loader — refetches when filters/page/per change.
  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({
      page: String(page),
      per: String(per),
      ...(filters.q && { q: filters.q }),
      ...(filters.tenant && { tenant: filters.tenant }),
      ...(filters.category && { table_category: filters.category }),
      ...(filters.table && { table: filters.table }),
      ...(filters.status && { status: filters.status }),
    }).toString();

    ceoFetch<VisitTokensListResponse>(`/api/v1/ceo/tokens?${qs}`)
      .then((res) => {
        if (!cancelled) {
          setList(res);
          setError(null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [locale, page, per, filters, reloadTick]);

  // Options (tenants + zones + tables) — fetched once.
  useEffect(() => {
    let cancelled = false;
    ceoFetch<VisitTokenOptionsResponse>('/api/v1/ceo/tokens/options')
      .then((res) => {
        if (!cancelled) setOptions(res.data);
      })
      .catch(() => {
        /* options are progressive enhancement; ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);
  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected(new Set());
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────
  const revokeOne = async (id: string) => {
    if (!window.confirm(t('confirm_revoke'))) return;
    await ceoSend(`/api/v1/ceo/tokens/${id}/revoke`, 'POST');
    reload();
  };
  const deleteOne = async (id: string) => {
    if (!window.confirm(t('confirm_delete'))) return;
    await ceoSend(`/api/v1/ceo/tokens/${id}`, 'DELETE');
    reload();
  };
  const bulkApply = async (action: 'revoke' | 'delete') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const msg = action === 'revoke' ? t('confirm_bulk_revoke', { count: ids.length }) : t('confirm_bulk_delete', { count: ids.length });
    if (!window.confirm(msg)) return;
    await ceoSend('/api/v1/ceo/tokens/bulk', 'POST', { action, ids });
    setSelected(new Set());
    reload();
  };

  const rows = list?.rows ?? [];
  const summary = list?.summary;
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = rows.some((r) => selected.has(r.id));
  const showBulkBar = selected.size > 0;

  return (
    <div className="space-y-3.5">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t('btn_new')}
          </button>
        }
      />

      {/* Summary chips */}
      <SummaryChips
        summary={summary}
        current={filters.status}
        onSelect={(s) => setFilter('status', s)}
        t={t}
      />

      {/* Filters */}
      <Filters_
        filters={filters}
        options={options}
        onChange={setFilter}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setPage(1);
          setSelected(new Set());
        }}
        t={t}
      />

      {/* Bulk bar */}
      {showBulkBar ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-[12px]">
          <span className="font-bold text-blue-900 dark:text-blue-200 tabular-nums">
            {t('bulk_selected', { count: selected.size })}
          </span>
          <span className="text-blue-700 dark:text-blue-300">→</span>
          <button
            type="button"
            onClick={() => bulkApply('revoke')}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
            {t('bulk_action_revoke')}
          </button>
          <button
            type="button"
            onClick={() => bulkApply('delete')}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
          >
            <Trash2 className="h-3 w-3" strokeWidth={2.5} />
            {t('bulk_action_delete')}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95"
          >
            {t('bulk_cancel')}
          </button>
        </div>
      ) : null}

      {/* Table */}
      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
          {error}
        </div>
      ) : list === null ? (
        <div className="h-64 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse" />
      ) : (
        <TokensTable
          rows={rows}
          selected={selected}
          allChecked={allChecked}
          someChecked={someChecked}
          onToggleAll={(on) => {
            setSelected(on ? new Set(rows.map((r) => r.id)) : new Set());
          }}
          onToggleOne={(id, on) => {
            setSelected((prev) => {
              const next = new Set(prev);
              if (on) next.add(id);
              else next.delete(id);
              return next;
            });
          }}
          onRevoke={revokeOne}
          onDelete={deleteOne}
          t={t}
        />
      )}

      {/* Pagination */}
      {list ? (
        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          per={per}
          rowCount={rows.length}
          onPage={setPage}
          onPer={(v) => {
            setPer(v);
            setPage(1);
          }}
          t={t}
        />
      ) : null}

      {/* Create modal */}
      {modalOpen ? (
        <CreateModal
          options={options}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            reload();
          }}
          t={t}
        />
      ) : null}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function SummaryChips({
  summary,
  current,
  onSelect,
  t,
}: {
  summary: VisitTokensListResponse['summary'] | undefined;
  current: Filters['status'];
  onSelect: (s: Filters['status']) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const chips: Array<{ key: Filters['status']; label: string; count: number; tone: string }> = [
    {
      key: '',
      label: t('chip_total'),
      count: summary?.total ?? 0,
      tone: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    },
    {
      key: 'valid',
      label: t('chip_valid'),
      count: summary?.valid ?? 0,
      tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    },
    {
      key: 'used',
      label: t('chip_used'),
      count: summary?.used ?? 0,
      tone: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    },
    {
      key: 'expired',
      label: t('chip_expired'),
      count: summary?.expired ?? 0,
      tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => {
        const active = current === c.key;
        return (
          <button
            key={c.key || 'all'}
            type="button"
            onClick={() => onSelect(c.key)}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold transition-colors active:scale-95',
              active
                ? c.tone + ' ring-2 ring-offset-1 ring-current/30'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
          >
            {c.label}
            <span className="tabular-nums opacity-80">{c.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function Filters_({
  filters,
  options,
  onChange,
  onReset,
  t,
}: {
  filters: Filters;
  options: Options | null;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const tenant = options?.tenants.find((x) => x.id === filters.tenant);
  const categories = tenant?.categories ?? options?.tenants.flatMap((x) => x.categories) ?? [];
  const tables = (() => {
    const all = tenant?.tables ?? options?.tenants.flatMap((x) => x.tables) ?? [];
    return filters.category ? all.filter((tb) => tb.category_id === filters.category) : all;
  })();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" strokeWidth={2.2} />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange('q', e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full h-8 pl-7 pr-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>
      <select
        value={filters.tenant}
        onChange={(e) => {
          onChange('tenant', e.target.value);
          onChange('category', '');
          onChange('table', '');
        }}
        className="h-8 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="">{t('filter_all_restaurants')}</option>
        {options?.tenants.map((tn) => (
          <option key={tn.id} value={tn.id}>
            {tn.name}
          </option>
        ))}
      </select>
      <select
        value={filters.category}
        onChange={(e) => {
          onChange('category', e.target.value);
          onChange('table', '');
        }}
        className="h-8 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="">{t('filter_all_zones')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name ?? '—'}
          </option>
        ))}
      </select>
      <select
        value={filters.table}
        onChange={(e) => onChange('table', e.target.value)}
        className="h-8 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <option value="">{t('filter_all_tables')}</option>
        {tables.map((tb) => (
          <option key={tb.id} value={tb.id}>
            {tb.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
        {t('filter_reset')}
      </button>
    </div>
  );
}

function TokensTable({
  rows,
  selected,
  allChecked,
  someChecked,
  onToggleAll,
  onToggleOne,
  onRevoke,
  onDelete,
  t,
}: {
  rows: VisitTokenRow[];
  selected: Set<string>;
  allChecked: boolean;
  someChecked: boolean;
  onToggleAll: (on: boolean) => void;
  onToggleOne: (id: string, on: boolean) => void;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
        <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <p className="text-[13px]">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827]">
      <table className="w-full text-[12px]">
        <thead className="bg-gray-50 dark:bg-gray-900 text-[10px] uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-3 py-2 w-8 text-left">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked && !allChecked;
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer"
              />
            </th>
            <th className="px-3 py-2 text-left font-semibold">{t('th_target')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('th_visit_ref')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('th_status')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('th_created')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('th_expires')}</th>
            <th className="px-3 py-2 text-left font-semibold hidden md:table-cell">{t('th_creator')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('th_actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={(e) => onToggleOne(r.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer"
                />
              </td>
              <td className="px-3 py-2">
                <div className="font-semibold text-gray-900 dark:text-white">{r.table ?? '—'}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {[r.table_category, r.tenant].filter(Boolean).join(' · ') || '—'}
                </div>
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                {r.visit_reference || '—'}
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={r.status} t={t} />
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-600 dark:text-gray-400">
                {r.created_at_human ?? '—'}
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-600 dark:text-gray-400">
                {r.expires_at_human ?? '—'}
              </td>
              <td className="px-3 py-2 hidden md:table-cell text-gray-600 dark:text-gray-400">
                {r.creator ?? '—'}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {r.status === 'valid' ? (
                  <button
                    type="button"
                    onClick={() => onRevoke(r.id)}
                    title={t('action_revoke')}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 active:scale-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  title={t('action_delete')}
                  className="ml-1 inline-flex items-center justify-center h-7 w-7 rounded-md text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status, t }: { status: VisitTokenStatus; t: ReturnType<typeof useTranslations> }) {
  if (status === 'valid') return <Badge variant="success">{t('status_valid')}</Badge>;
  if (status === 'used') return <Badge variant="default">{t('status_used')}</Badge>;
  return <Badge variant="warning">{t('status_expired')}</Badge>;
}

function Pagination({
  page,
  pages,
  total,
  per,
  rowCount,
  onPage,
  onPer,
  t,
}: {
  page: number;
  pages: number;
  total: number;
  per: number;
  rowCount: number;
  onPage: (n: number) => void;
  onPer: (n: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const start = total === 0 ? 0 : (page - 1) * per + 1;
  const end = total === 0 ? 0 : (page - 1) * per + rowCount;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
      <span className="tabular-nums">
        {t('info_range', { start, end, total })}
      </span>
      <span className="flex-1" />
      <label className="font-semibold">{t('per_page')}</label>
      <select
        value={per}
        onChange={(e) => onPer(parseInt(e.target.value, 10))}
        className="h-7 px-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      >
        {[25, 50, 100, 200].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <PageButton onClick={() => onPage(1)} disabled={page <= 1} icon={<ChevronsLeft className="h-3.5 w-3.5" />} />
      <PageButton
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        icon={<ChevronLeft className="h-3.5 w-3.5" />}
      />
      <span className="tabular-nums font-semibold text-gray-900 dark:text-white">
        {page} {t('page_of', { pages })}
      </span>
      <PageButton
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page >= pages}
        icon={<ChevronRight className="h-3.5 w-3.5" />}
      />
      <PageButton onClick={() => onPage(pages)} disabled={page >= pages} icon={<ChevronsRight className="h-3.5 w-3.5" />} />
    </div>
  );
}

function PageButton({ onClick, disabled, icon }: { onClick: () => void; disabled: boolean; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
    >
      {icon}
    </button>
  );
}

function CreateModal({
  options,
  onClose,
  onCreated,
  t,
}: {
  options: Options | null;
  onClose: () => void;
  onCreated: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [tenantId, setTenantId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tableId, setTableId] = useState<string>('');
  const [visitRef, setVisitRef] = useState<string>('');
  const [ttl, setTtl] = useState<number>(24);
  const [count, setCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<VisitTokenCreated[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tenant = options?.tenants.find((x) => x.id === tenantId);
  const categories = tenant?.categories ?? [];
  const tables = useMemo(() => {
    const all = tenant?.tables ?? [];
    return categoryId ? all.filter((tb) => tb.category_id === categoryId) : all;
  }, [tenant, categoryId]);

  // Default to first owned tenant once options arrive.
  useEffect(() => {
    if (!tenantId && options && options.tenants[0]) setTenantId(options.tenants[0].id);
  }, [options, tenantId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await ceoSend<{ ok: boolean; tokens: VisitTokenCreated[]; count: number }>(
        '/api/v1/ceo/tokens',
        'POST',
        {
          tenant_id: tenantId,
          table_category_id: categoryId || null,
          table_id: tableId || null,
          visit_reference: visitRef.trim() || null,
          ttl_hours: ttl,
          count,
        },
      );
      setCreated(res.tokens);
    } catch (e) {
      const body = (e as { body?: { errors?: Record<string, string[]>; message?: string } }).body;
      const first = body?.errors ? Object.values(body.errors).flat()[0] : body?.message;
      setErr(first ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (s: string) => {
    try {
      await navigator.clipboard.writeText(s);
    } catch {
      /* clipboard blocked; ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 dark:text-white">{t('modal_title')}</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t('modal_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 -m-1"
            aria-label="close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {created === null ? (
          <form onSubmit={submit} className="p-4 space-y-3 text-[12px]">
            <Field label={t('modal_field_restaurant')}>
              <select
                value={tenantId}
                onChange={(e) => {
                  setTenantId(e.target.value);
                  setCategoryId('');
                  setTableId('');
                }}
                required
                className="w-full h-9 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {options?.tenants.map((tn) => (
                  <option key={tn.id} value={tn.id}>
                    {tn.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('modal_field_zone')}>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setTableId('');
                  }}
                  className="w-full h-9 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="">{t('modal_field_zone_any')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? '—'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('modal_field_table')}>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="">{t('modal_field_table_any')}</option>
                  {tables.map((tb) => (
                    <option key={tb.id} value={tb.id}>
                      {tb.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t('modal_field_visit_ref')}>
              <input
                type="text"
                value={visitRef}
                onChange={(e) => setVisitRef(e.target.value)}
                placeholder="VIP-42"
                className="w-full h-9 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('modal_field_ttl')}>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={ttl}
                  onChange={(e) => setTtl(Math.max(1, Math.min(168, parseInt(e.target.value, 10) || 24)))}
                  className="w-full h-9 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 tabular-nums"
                />
              </Field>
              <Field label={t('modal_field_count')}>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                  className="w-full h-9 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 tabular-nums"
                />
              </Field>
            </div>
            {err ? (
              <p className="text-[12px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 rounded-md px-2.5 py-2">
                {err}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-[12px] font-semibold active:scale-95"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || !tenantId}
                className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold disabled:opacity-50 active:scale-95"
              >
                {t('modal_submit')}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-3">
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 px-3 py-2 text-[12px] font-semibold flex items-center gap-2">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              {t('modal_success', { count: created.length })}
            </div>
            <h3 className="text-[12px] font-bold text-gray-900 dark:text-white">{t('modal_show_tokens')}</h3>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {created.map((tk, i) => (
                <li
                  key={tk.id}
                  className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-800 px-2.5 py-2 text-[11px]"
                >
                  <span className="text-gray-400 tabular-nums w-5">{i + 1}.</span>
                  <code className="flex-1 font-mono text-gray-800 dark:text-gray-200 truncate">{tk.token}</code>
                  <button
                    type="button"
                    onClick={() => copy(tk.token)}
                    title={t('action_copy')}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
                  >
                    <Copy className="h-3 w-3" strokeWidth={2.2} />
                  </button>
                  <a
                    href={tk.url}
                    target="_blank"
                    rel="noreferrer"
                    title={t('action_open_link')}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-95"
                  >
                    <LinkIcon className="h-3 w-3" strokeWidth={2.2} />
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onCreated}
                className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold active:scale-95"
              >
                {t('modal_cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
