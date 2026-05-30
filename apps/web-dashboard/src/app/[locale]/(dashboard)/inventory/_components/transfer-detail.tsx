'use client';

import { transferDocumentsApi, type TransferDocument } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { DocDetailModal } from './doc-detail-modal';
import { StatusBadge } from './status-badge';
import { CenteredSpinner, ErrorBanner, secondaryBtnClass } from './ui-helpers';
import { formatDate } from './format';

type Props = {
  id: string;
  onClose: () => void;
};

export function TransferDetail({ id, onClose }: Props) {
  const t = useTranslations('inventory');

  const query = useQuery({
    queryKey: ['transfer-documents', id],
    queryFn: () => transferDocumentsApi.get(apiClient, id),
  });

  const doc: TransferDocument | undefined = query.data?.data;

  return (
    <DocDetailModal
      title={doc?.doc_no ?? '...'}
      subtitle={doc ? `${formatDate(doc.doc_date)}${doc.creator ? ` · ${doc.creator.name}` : ''}` : undefined}
      onClose={onClose}
      badge={doc ? <StatusBadge status={doc.status} /> : null}
      size="lg"
      footer={
        <button type="button" onClick={onClose} className={secondaryBtnClass}>
          {t('actions.cancel')}
        </button>
      }
    >
      {query.isLoading ? (
        <CenteredSpinner />
      ) : query.isError || !doc ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(22,34,31,0.06)] bg-[#fafbfa] p-4 text-sm dark:border-[rgba(255,255,255,0.05)] dark:bg-[#0d1424]">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                {t('fields.from_warehouse')}
              </p>
              <p className="mt-0.5 font-semibold text-[#16221f] dark:text-white">
                {doc.from_warehouse?.name ?? '—'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#62716d] dark:text-[#94a3b8]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                {t('fields.to_warehouse')}
              </p>
              <p className="mt-0.5 font-semibold text-[#16221f] dark:text-white">
                {doc.to_warehouse?.name ?? '—'}
              </p>
            </div>
          </div>

          {doc.notes ? (
            <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">{doc.notes}</p>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
            <table className="w-full text-sm">
              <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
                <tr>
                  <th className="px-4 py-2.5 text-left">{t('fields.ingredient')}</th>
                  <th className="px-4 py-2.5 text-right">{t('fields.quantity')}</th>
                  <th className="px-4 py-2.5 text-left">{t('fields.notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                {(doc.items ?? []).map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#16221f] dark:text-white">
                        {it.ingredient?.name.uz ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                      {it.quantity.toLocaleString('uz', { maximumFractionDigits: 3 })}
                      {it.ingredient?.unit ? (
                        <span className="ml-1 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                          {it.ingredient.unit}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                      {it.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DocDetailModal>
  );
}
