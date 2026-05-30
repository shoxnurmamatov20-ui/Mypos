'use client';

import {
  wasteDocumentsApi,
  type ListWasteDocumentsParams,
  type WasteDocument,
  type WasteReason,
} from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarRange,
  Eye,
  Plus,
  Trash2,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DashStatCard } from '../../_components/stat-card';
import { ReasonBadge, StatusBadge } from '../_components/status-badge';
import { WasteDetail } from '../_components/waste-detail';
import { WasteDocumentForm } from '../_components/waste-document-form';
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
  today,
} from '../_components/format';

const REASONS: WasteReason[] = ['expired', 'damaged', 'lost', 'theft', 'other'];

export function WasteView() {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [reason, setReason] = useState<WasteReason | ''>('');
  const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
  const [dateTo, setDateTo] = useState<string>(today());
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const params: ListWasteDocumentsParams = {
    warehouse_id: warehouseId || undefined,
    reason: reason || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    per_page: 50,
  };

  const query = useQuery({
    queryKey: ['waste-documents', params],
    queryFn: () => wasteDocumentsApi.list(apiClient, params),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const monthStatQuery = useQuery({
    queryKey: ['waste-documents', 'stats-month'],
    queryFn: () =>
      wasteDocumentsApi.list(apiClient, {
        date_from: startOfMonth(),
        date_to: today(),
        per_page: 500,
      }),
    refetchInterval: 60_000,
  });

  const docs: WasteDocument[] = query.data?.data ?? [];
  const monthDocs = monthStatQuery.data?.data ?? [];

  const monthStats = useMemo(() => {
    const count = monthDocs.length;
    const cost = monthDocs.reduce((s, d) => s + (d.total_cost || 0), 0);
    const reasonCount = new Map<string, number>();
    for (const d of monthDocs) {
      reasonCount.set(d.reason, (reasonCount.get(d.reason) ?? 0) + 1);
    }
    let topReason: string | null = null;
    let topCount = 0;
    for (const [k, v] of reasonCount.entries()) {
      if (v > topCount) {
        topReason = k;
        topCount = v;
      }
    }
    return { count, cost, topReason };
  }, [monthDocs]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wasteDocumentsApi.delete(apiClient, id),
    onSuccess: () => {
      toast.success(t('toast.deleted'));
      void qc.invalidateQueries({ queryKey: ['waste-documents'] });
    },
    onError: () => toast.error(t('toast.delete_failed')),
  });

  return (
    <>
      {monthStatQuery.isLoading ? (
        <StatStripSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DashStatCard
            label={t('waste.stats.this_month')}
            value={String(monthStats.count)}
            icon={TrendingDown}
            accent="red"
            fillPct={100}
          />
          <DashStatCard
            label={t('waste.stats.cost_value')}
            value={formatUZS(monthStats.cost)}
            icon={Wallet}
            accent="amber"
            fillPct={100}
          />
          <DashStatCard
            label={t('waste.stats.top_reason')}
            value={monthStats.topReason ? t(`reasons.${monthStats.topReason}`) : '—'}
            icon={AlertTriangle}
            accent="violet"
            fillPct={100}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-56">
          <WarehouseSelect value={warehouseId} onChange={setWarehouseId} includeAll />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as WasteReason | '')}
            className={inputClass}
          >
            <option value="">{t('filters.all_reasons')}</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`reasons.${r}`)}
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
          {t('actions.new_waste')}
        </button>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title={t('empty.waste')}
          action={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={primaryBtnClass}
            >
              <Plus className="h-4 w-4" />
              {t('actions.new_waste')}
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
                <th className="px-4 py-3 text-left">{t('fields.warehouse')}</th>
                <th className="px-4 py-3 text-left">{t('fields.reason')}</th>
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
                    {d.warehouse?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ReasonBadge reason={d.reason} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {d.items_count ?? d.items?.length ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                    {formatUZS(d.total_cost)}
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

      {creating ? <WasteDocumentForm onClose={() => setCreating(false)} /> : null}
      {viewingId ? <WasteDetail id={viewingId} onClose={() => setViewingId(null)} /> : null}
    </>
  );
}
