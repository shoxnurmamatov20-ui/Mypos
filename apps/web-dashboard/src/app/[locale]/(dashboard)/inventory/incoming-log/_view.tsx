'use client';

import {
  type IncomingDocument,
  incomingDocumentsApi,
  type ListIncomingDocumentsParams,
} from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Download,
  ScrollText,
  Truck,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DashStatCard } from '../../_components/stat-card';
import { daysAgo, formatDate, today } from '../_components/format';
import { StatusBadge } from '../_components/status-badge';
import {
  EmptyState,
  ErrorBanner,
  inputClass,
  StatStripSkeleton,
  secondaryBtnClass,
  TableSkeleton,
} from '../_components/ui-helpers';
import { WarehouseSelect } from '../_components/warehouse-select';

export function IncomingLogView() {
  const t = useTranslations('inventory');

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>(daysAgo(30));
  const [dateTo, setDateTo] = useState<string>(today());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const params: ListIncomingDocumentsParams = {
    warehouse_id: warehouseId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    per_page: 100,
  };

  const query = useQuery({
    queryKey: ['incoming-documents', 'log', params],
    queryFn: () => incomingDocumentsApi.list(apiClient, params),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const docs: IncomingDocument[] = query.data?.data ?? [];

  const stats = useMemo(() => {
    const total = docs.length;
    const totalAmount = docs.reduce((s, d) => s + (d.total_amount || 0), 0);
    const suppliers = new Set(
      docs.map((d) => (d.supplier_name ?? '').trim()).filter((n) => n !== ''),
    );
    return { total, totalAmount, supplierCount: suppliers.size };
  }, [docs]);

  /** Group by YYYY-MM for collapsible sections. */
  const grouped = useMemo(() => {
    const groups = new Map<string, IncomingDocument[]>();
    for (const d of docs) {
      const key = d.doc_date.slice(0, 7);
      const arr = groups.get(key) ?? [];
      arr.push(d);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [docs]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      {query.isLoading ? (
        <StatStripSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DashStatCard
            label={t('incoming_log.stats.total_records')}
            value={String(stats.total)}
            icon={ScrollText}
            accent="indigo"
            fillPct={100}
          />
          <DashStatCard
            label={t('incoming.stats.total_value')}
            value={formatUZS(stats.totalAmount)}
            icon={Wallet}
            accent="teal"
            fillPct={100}
          />
          <DashStatCard
            label={t('incoming_log.stats.suppliers')}
            value={String(stats.supplierCount)}
            icon={Truck}
            accent="violet"
            fillPct={100}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-56">
          <WarehouseSelect value={warehouseId} onChange={setWarehouseId} includeAll />
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
          disabled
          title={t('coming_soon')}
          className={`${secondaryBtnClass} ml-auto cursor-not-allowed opacity-60`}
        >
          <Download className="h-4 w-4" />
          {t('actions.export')}
        </button>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState icon={ScrollText} title={t('empty.incoming_log')} />
      ) : (
        <div className="space-y-4">
          {grouped.map(([month, list]) => (
            <section key={month} className="space-y-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#62716d] dark:text-[#94a3b8]">
                {month}
                <span className="ml-2 text-[#16221f] dark:text-white">({list.length})</span>
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
                <table className="w-full text-sm">
                  <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
                    <tr>
                      <th className="w-8 px-2 py-3" />
                      <th className="px-4 py-3 text-left">{t('fields.doc_no')}</th>
                      <th className="px-4 py-3 text-left">{t('fields.doc_date')}</th>
                      <th className="px-4 py-3 text-left">{t('fields.supplier')}</th>
                      <th className="px-4 py-3 text-left">{t('fields.warehouse')}</th>
                      <th className="px-4 py-3 text-right">{t('fields.items_count')}</th>
                      <th className="px-4 py-3 text-right">{t('fields.total')}</th>
                      <th className="px-4 py-3 text-left">{t('fields.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                    {list.map((d) => {
                      const isOpen = expanded.has(d.id);
                      return (
                        <ExpandableRow
                          key={d.id}
                          doc={d}
                          isOpen={isOpen}
                          onToggle={() => toggle(d.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function ExpandableRow({
  doc,
  isOpen,
  onToggle,
}: {
  doc: IncomingDocument;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('inventory');

  // Fetch items on-demand only when expanded (cheap; cached).
  const itemsQuery = useQuery({
    queryKey: ['incoming-documents', doc.id, 'items'],
    queryFn: () => incomingDocumentsApi.get(apiClient, doc.id),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const items = itemsQuery.data?.data?.items ?? doc.items ?? [];

  return (
    <>
      <tr className="cursor-pointer hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]" onClick={onToggle}>
        <td className="px-2 py-3 text-center text-[#62716d] dark:text-[#94a3b8]">
          {isOpen ? (
            <ChevronDown className="mx-auto h-4 w-4" />
          ) : (
            <ChevronRight className="mx-auto h-4 w-4" />
          )}
        </td>
        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#16221f] dark:text-white">
          {doc.doc_no}
        </td>
        <td className="px-4 py-3 text-[#16221f] dark:text-white">{formatDate(doc.doc_date)}</td>
        <td className="px-4 py-3 text-[#16221f] dark:text-white">{doc.supplier_name ?? '—'}</td>
        <td className="px-4 py-3 text-[#16221f] dark:text-white">{doc.warehouse?.name ?? '—'}</td>
        <td className="px-4 py-3 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
          {doc.items_count ?? items.length ?? '—'}
        </td>
        <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
          {formatUZS(doc.total_amount)}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={doc.status} />
        </td>
      </tr>
      {isOpen ? (
        <tr className="bg-[#fafbfa] dark:bg-[#0d1424]">
          <td colSpan={8} className="px-4 py-3">
            {itemsQuery.isLoading ? (
              <div className="py-3 text-center text-xs text-[#62716d] dark:text-[#94a3b8]">...</div>
            ) : items.length === 0 ? (
              <div className="py-3 text-center text-xs text-[#62716d] dark:text-[#94a3b8]">—</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-[#62716d] dark:text-[#94a3b8]">
                  <tr>
                    <th className="py-1.5 text-left">{t('fields.ingredient')}</th>
                    <th className="py-1.5 text-right">{t('fields.quantity')}</th>
                    <th className="py-1.5 text-right">{t('fields.unit_price')}</th>
                    <th className="py-1.5 text-right">{t('fields.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-1 text-[#16221f] dark:text-white">
                        {it.ingredient?.name.uz ?? '—'}
                      </td>
                      <td className="py-1 text-right tabular-nums text-[#16221f] dark:text-white">
                        {it.quantity.toLocaleString('uz', { maximumFractionDigits: 3 })}
                      </td>
                      <td className="py-1 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                        {formatUZS(it.unit_price)}
                      </td>
                      <td className="py-1 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                        {formatUZS(it.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
