'use client';

import { incomingDocumentsApi, type IncomingDocument } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
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

export function IncomingDetail({ id, onClose }: Props) {
  const t = useTranslations('inventory');

  const query = useQuery({
    queryKey: ['incoming-documents', id],
    queryFn: () => incomingDocumentsApi.get(apiClient, id),
  });

  const doc: IncomingDocument | undefined = query.data?.data;

  return (
    <DocDetailModal
      title={doc?.doc_no ?? '...'}
      subtitle={
        doc
          ? `${formatDate(doc.doc_date)} · ${doc.warehouse?.name ?? '—'}${
              doc.creator ? ` · ${doc.creator.name}` : ''
            }`
          : undefined
      }
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
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                {t('fields.supplier')}
              </dt>
              <dd className="mt-0.5 text-[#16221f] dark:text-white">
                {doc.supplier_name ?? '—'}
              </dd>
            </div>
            {doc.supplier_inn ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                  {t('fields.supplier_inn')}
                </dt>
                <dd className="mt-0.5 text-[#16221f] dark:text-white">{doc.supplier_inn}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                {t('fields.total')}
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[#16221f] dark:text-white">
                {formatUZS(doc.total_amount)}
              </dd>
            </div>
            {doc.notes ? (
              <div className="sm:col-span-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                  {t('fields.notes')}
                </dt>
                <dd className="mt-0.5 text-[#16221f] dark:text-white">{doc.notes}</dd>
              </div>
            ) : null}
          </dl>

          <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
            <table className="w-full text-sm">
              <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
                <tr>
                  <th className="px-4 py-2.5 text-left">{t('fields.ingredient')}</th>
                  <th className="px-4 py-2.5 text-right">{t('fields.quantity')}</th>
                  <th className="px-4 py-2.5 text-right">{t('fields.unit_price')}</th>
                  <th className="px-4 py-2.5 text-right">{t('fields.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
                {(doc.items ?? []).map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#16221f] dark:text-white">
                        {it.ingredient?.name.uz ?? '—'}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                        {it.batch_number ? <span>partiya: {it.batch_number}</span> : null}
                        {it.expiry_date ? <span>exp: {formatDate(it.expiry_date)}</span> : null}
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
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                      {formatUZS(it.unit_price)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-[#16221f] dark:text-white">
                      {formatUZS(it.total_price)}
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
