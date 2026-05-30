'use client';

import {
  incomingDocumentsApi,
  type IncomingDocument,
  type IncomingStatus,
  type ListIncomingDocumentsParams,
} from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarRange,
  Eye,
  PackagePlus,
  Plus,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DashStatCard } from '../../_components/stat-card';
import { IncomingDocumentForm } from '../_components/incoming-document-form';
import { IncomingDetail } from '../_components/incoming-detail';
import { StatusBadge } from '../_components/status-badge';
import {
  EmptyState,
  ErrorBanner,
  StatStripSkeleton,
  TableSkeleton,
  inputClass,
  primaryBtnClass,
} from '../_components/ui-helpers';
import { WarehouseSelect } from '../_components/warehouse-select';
import {
  daysAgo,
  formatDate,
  startOfMonth,
  startOfWeek,
  today,
} from '../_components/format';

const STATUSES: IncomingStatus[] = ['draft', 'posted', 'cancelled'];

export function IncomingView() {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [status, setStatus] = useState<IncomingStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
  const [dateTo, setDateTo] = useState<string>(today());
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const params: ListIncomingDocumentsParams = {
    warehouse_id: warehouseId || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    per_page: 50,
  };

  const query = useQuery({
    queryKey: ['incoming-documents', params],
    queryFn: () => incomingDocumentsApi.list(apiClient, params),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  // Today stat: needs a tighter call so the filter range doesn't hide it.
  const todayStatQuery = useQuery({
    queryKey: ['incoming-documents', 'stats-today'],
    queryFn: () =>
      incomingDocumentsApi.list(apiClient, {
        date_from: today(),
        date_to: today(),
        per_page: 100,
      }),
    refetchInterval: 60_000,
  });

  const weekStatQuery = useQuery({
    queryKey: ['incoming-documents', 'stats-week'],
    queryFn: () =>
      incomingDocumentsApi.list(apiClient, {
        date_from: startOfWeek(),
        date_to: today(),
        per_page: 200,
      }),
    refetchInterval: 60_000,
  });

  const monthStatQuery = useQuery({
    queryKey: ['incoming-documents', 'stats-month'],
    queryFn: () =>
      incomingDocumentsApi.list(apiClient, {
        date_from: startOfMonth(),
        date_to: today(),
        per_page: 500,
      }),
    refetchInterval: 60_000,
  });

  const docs: IncomingDocument[] = query.data?.data ?? [];
  const todayCount = todayStatQuery.data?.data?.length ?? 0;
  const weekCount = weekStatQuery.data?.data?.length ?? 0;

  const monthStats = useMemo(() => {
    const list = monthStatQuery.data?.data ?? [];
    const totalAmount = list.reduce((s, d) => s + (d.total_amount || 0), 0);
    const suppliers = new Set(
      list.map((d) => (d.supplier_name ?? '').trim()).filter((n) => n !== ''),
    );
    return { totalAmount, supplierCount: suppliers.size };
  }, [monthStatQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incomingDocumentsApi.delete(apiClient, id),
    onSuccess: () => {
      toast.success(t('toast.deleted'));
      void qc.invalidateQueries({ queryKey: ['incoming-documents'] });
    },
    onError: () => toast.error(t('toast.delete_failed')),
  });

  return (
    <>
      {/* Stats strip */}
      {todayStatQuery.isLoading ||
      weekStatQuery.isLoading ||
      monthStatQuery.isLoading ? (
        <StatStripSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <DashStatCard
            label={t('incoming.stats.today')}
            value={String(todayCount)}
            icon={PackagePlus}
            accent="green"
            fillPct={100}
          />
          <DashStatCard
            label={t('incoming.stats.this_week')}
            value={String(weekCount)}
            icon={TrendingUp}
            accent="teal"
            fillPct={100}
          />
          <DashStatCard
            label={t('incoming.stats.total_value')}
            value={formatUZS(monthStats.totalAmount)}
            icon={Wallet}
            accent="indigo"
            fillPct={100}
          />
          <DashStatCard
            label={t('incoming.stats.suppliers')}
            value={String(monthStats.supplierCount)}
            icon={Truck}
            accent="violet"
            fillPct={100}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-56">
          <WarehouseSelect value={warehouseId} onChange={setWarehouseId} includeAll />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IncomingStatus | '')}
            className={inputClass}
          >
            <option value="">{t('filters.all_statuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <CalendarRange className="h-4 w-4 flex-shrink-0 text-[#62716d] dark:text-[#94a3b8]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <span className="text-xs text-[#62716d] dark:text-[#94a3b8]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`${inputClass} flex-1`}
          />
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={`${primaryBtnClass} ml-auto`}
        >
          <Plus className="h-4 w-4" />
          {t('actions.new_incoming')}
        </button>
      </div>

      {/* Table */}
      {query.isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title={t('empty.incoming')}
          action={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={primaryBtnClass}
            >
              <Plus className="h-4 w-4" />
              {t('actions.new_incoming')}
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-3 text-left">{t('fields.doc_no')}</th>
                <th className="px-4 py-3 text-left">{t('fields.doc_date')}</th>
                <th className="px-4 py-3 text-left">{t('fields.supplier')}</th>
                <th className="px-4 py-3 text-left">{t('fields.warehouse')}</th>
                <th className="px-4 py-3 text-right">{t('fields.items_count')}</th>
                <th className="px-4 py-3 text-right">{t('fields.total')}</th>
                <th className="px-4 py-3 text-left">{t('fields.status')}</th>
                <th className="px-4 py-3 text-right">{t('fields.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {docs.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
                  onClick={() => setViewingId(d.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#16221f] dark:text-white">
                    {d.doc_no}
                  </td>
                  <td className="px-4 py-3 text-[#16221f] dark:text-white">
                    {formatDate(d.doc_date)}
                  </td>
                  <td className="px-4 py-3 text-[#16221f] dark:text-white">
                    {d.supplier_name ?? '—'}
                    {d.supplier_inn ? (
                      <div className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                        INN {d.supplier_inn}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[#16221f] dark:text-white">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-[#62716d] dark:text-[#94a3b8]" />
                      {d.warehouse?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {d.items_count ?? d.items?.length ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                    {formatUZS(d.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingId(d.id)}
                        aria-label={t('actions.view')}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#0f766e] hover:bg-[#eef4f3] dark:text-teal-400 dark:hover:bg-[#1a2235]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {d.status === 'draft' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(t('confirm.delete_doc'))) return;
                            deleteMutation.mutate(d.id);
                          }}
                          disabled={deleteMutation.isPending}
                          aria-label={t('actions.delete')}
                          className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating ? <IncomingDocumentForm onClose={() => setCreating(false)} /> : null}
      {viewingId ? (
        <IncomingDetail id={viewingId} onClose={() => setViewingId(null)} />
      ) : null}
    </>
  );
}
