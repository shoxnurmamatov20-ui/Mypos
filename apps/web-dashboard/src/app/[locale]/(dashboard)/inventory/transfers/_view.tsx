'use client';

import {
  type ListTransferDocumentsParams,
  type TransferDocument,
  transferDocumentsApi,
} from '@mypos/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CalendarRange,
  CheckCircle2,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DashStatCard } from '../../_components/stat-card';
import { daysAgo, formatDate, startOfMonth, today } from '../_components/format';
import { StatusBadge } from '../_components/status-badge';
import { TransferDetail } from '../_components/transfer-detail';
import { TransferDocumentForm } from '../_components/transfer-document-form';
import {
  EmptyState,
  ErrorBanner,
  inputClass,
  primaryBtnClass,
  StatStripSkeleton,
  TableSkeleton,
} from '../_components/ui-helpers';
import { useActiveWarehouses } from '../_components/warehouse-select';

export function TransfersView() {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
  const [dateTo, setDateTo] = useState<string>(today());
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const warehousesQuery = useActiveWarehouses();

  const params: ListTransferDocumentsParams = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    per_page: 50,
  };

  const query = useQuery({
    queryKey: ['transfer-documents', params],
    queryFn: () => transferDocumentsApi.list(apiClient, params),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const monthStatQuery = useQuery({
    queryKey: ['transfer-documents', 'stats-month'],
    queryFn: () =>
      transferDocumentsApi.list(apiClient, {
        date_from: startOfMonth(),
        date_to: today(),
        per_page: 500,
      }),
    refetchInterval: 60_000,
  });

  const docs: TransferDocument[] = query.data?.data ?? [];
  const monthDocs = monthStatQuery.data?.data ?? [];

  const stats = useMemo(() => {
    const pending = monthDocs.filter((d) => d.status === 'draft' || d.status === 'sent').length;
    const completed = monthDocs.filter((d) => d.status === 'received').length;
    const warehouseCount = (warehousesQuery.data?.data?.length as number | undefined) ?? 0;
    return { pending, completed, warehouseCount };
  }, [monthDocs, warehousesQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transferDocumentsApi.delete(apiClient, id),
    onSuccess: () => {
      toast.success(t('toast.deleted'));
      void qc.invalidateQueries({ queryKey: ['transfer-documents'] });
    },
    onError: () => toast.error(t('toast.delete_failed')),
  });

  return (
    <>
      {monthStatQuery.isLoading || warehousesQuery.isLoading ? (
        <StatStripSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DashStatCard
            label={t('transfers.stats.pending')}
            value={String(stats.pending)}
            icon={ArrowLeftRight}
            accent="amber"
            fillPct={100}
          />
          <DashStatCard
            label={t('transfers.stats.completed_month')}
            value={String(stats.completed)}
            icon={CheckCircle2}
            accent="green"
            fillPct={100}
          />
          <DashStatCard
            label={t('transfers.stats.warehouses')}
            value={String(stats.warehouseCount)}
            icon={Building2}
            accent="blue"
            fillPct={100}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
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
          {t('actions.new_transfer')}
        </button>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={t('empty.transfers')}
          action={
            <button type="button" onClick={() => setCreating(true)} className={primaryBtnClass}>
              <Plus className="h-4 w-4" />
              {t('actions.new_transfer')}
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
                <th className="px-4 py-3 text-right">{t('fields.items_count')}</th>
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{d.from_warehouse?.name ?? '—'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#62716d] dark:text-[#94a3b8]" />
                      <span>{d.to_warehouse?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {d.items_count ?? d.items?.length ?? '—'}
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

      {creating ? <TransferDocumentForm onClose={() => setCreating(false)} /> : null}
      {viewingId ? <TransferDetail id={viewingId} onClose={() => setViewingId(null)} /> : null}
    </>
  );
}
