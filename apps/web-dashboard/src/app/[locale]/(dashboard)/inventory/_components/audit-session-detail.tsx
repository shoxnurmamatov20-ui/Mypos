'use client';

import {
  type AuditSession,
  auditSessionsApi,
  type UpdateAuditSessionInput,
} from '@mypos/api-client';

type UpdateAuditSessionItemInput = NonNullable<UpdateAuditSessionInput['items']>[number];

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DocDetailModal } from './doc-detail-modal';
import { StatusBadge } from './status-badge';
import {
  CenteredSpinner,
  dangerBtnClass,
  ErrorBanner,
  primaryBtnClass,
  secondaryBtnClass,
} from './ui-helpers';

type Props = {
  sessionId: string;
  onClose: () => void;
};

export function AuditSessionDetail({ sessionId, onClose }: Props) {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['audit-sessions', sessionId],
    queryFn: () => auditSessionsApi.get(apiClient, sessionId),
  });

  const session: AuditSession | undefined = query.data?.data;
  const items = session?.items ?? [];
  const isCompleted = session?.status === 'completed' || session?.status === 'cancelled';

  /** Map<auditItemId, actualQuantityString>. Starts populated from server. */
  const [actuals, setActuals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!items.length) return;
    const next: Record<string, string> = {};
    for (const it of items) {
      next[it.id] = it.actual_quantity !== null ? String(it.actual_quantity) : '';
    }
    setActuals(next);
  }, [items]);

  const updateMutation = useMutation({
    mutationFn: (payloadItems: UpdateAuditSessionItemInput[]) =>
      auditSessionsApi.update(apiClient, sessionId, { items: payloadItems }),
    onSuccess: () => {
      toast.success(t('toast.updated'));
      void qc.invalidateQueries({ queryKey: ['audit-sessions'] });
    },
    onError: () => toast.error(t('toast.save_failed')),
  });

  const completeMutation = useMutation({
    mutationFn: () => auditSessionsApi.complete(apiClient, sessionId),
    onSuccess: () => {
      toast.success(t('toast.completed'));
      void qc.invalidateQueries({ queryKey: ['audit-sessions'] });
      onClose();
    },
    onError: () => toast.error(t('toast.complete_failed')),
  });

  const computedRows = useMemo(() => {
    return items.map((it) => {
      const actualStr = actuals[it.id] ?? '';
      const actual = actualStr === '' ? null : Number(actualStr);
      const valid = actual !== null && Number.isFinite(actual);
      const discrepancy = valid ? actual - it.expected_quantity : null;
      return { item: it, actualStr, actual, valid, discrepancy };
    });
  }, [items, actuals]);

  const handleSaveProgress = () => {
    const dirty = computedRows
      .filter((r) => r.valid)
      .map<UpdateAuditSessionItemInput>((r) => ({
        id: r.item.id,
        actual_quantity: r.actual as number,
      }));

    if (dirty.length === 0) {
      toast.error(t('form.items_required'));
      return;
    }
    updateMutation.mutate(dirty);
  };

  const handleComplete = () => {
    if (!confirm(t('confirm.complete_audit'))) return;
    // Persist any pending edits first, then complete.
    const dirty = computedRows
      .filter((r) => r.valid)
      .map<UpdateAuditSessionItemInput>((r) => ({
        id: r.item.id,
        actual_quantity: r.actual as number,
      }));
    if (dirty.length > 0) {
      updateMutation.mutate(dirty, {
        onSuccess: () => completeMutation.mutate(),
      });
    } else {
      completeMutation.mutate();
    }
  };

  return (
    <DocDetailModal
      title={t('audit_detail.title')}
      subtitle={
        session
          ? `${session.doc_no} · ${session.warehouse?.name ?? '—'} · ${formatDateTime(session.started_at)}`
          : undefined
      }
      onClose={onClose}
      size="xl"
      badge={session ? <StatusBadge status={session.status} /> : null}
      footer={
        !isCompleted ? (
          <>
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              {t('actions.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={updateMutation.isPending}
              className={secondaryBtnClass}
            >
              {updateMutation.isPending ? t('actions.saving') : t('audit_detail.save_progress')}
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={completeMutation.isPending || updateMutation.isPending}
              className={primaryBtnClass}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completeMutation.isPending ? t('actions.saving') : t('actions.complete')}
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            {t('actions.cancel')}
          </button>
        )
      }
    >
      {query.isLoading ? (
        <CenteredSpinner />
      ) : query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : computedRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t('audit_detail.no_items')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
          <table className="w-full text-sm">
            <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 text-left">{t('fields.ingredient')}</th>
                <th className="px-4 py-2.5 text-right">{t('fields.expected')}</th>
                <th className="px-4 py-2.5 text-right">{t('fields.actual')}</th>
                <th className="px-4 py-2.5 text-right">{t('fields.discrepancy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {computedRows.map(({ item, actualStr, discrepancy }) => (
                <tr key={item.id} className="bg-white dark:bg-[#111827]">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-[#16221f] dark:text-white">
                      {item.ingredient?.name.uz ?? '—'}
                    </div>
                    {item.ingredient?.sku ? (
                      <div className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                        {item.ingredient.sku} · {item.ingredient.unit}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                    {item.expected_quantity.toLocaleString('uz', { maximumFractionDigits: 3 })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      disabled={isCompleted}
                      value={actualStr}
                      onChange={(e) =>
                        setActuals((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-28 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-2 py-1.5 text-right text-sm tabular-nums text-[#16221f] outline-none focus:border-[#0f766e] disabled:opacity-60 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {discrepancy === null ? (
                      <span className="text-[#62716d] dark:text-[#94a3b8]">—</span>
                    ) : discrepancy === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">0</span>
                    ) : (
                      <span
                        className={
                          discrepancy < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {discrepancy > 0 ? '+' : ''}
                        {discrepancy.toLocaleString('uz', { maximumFractionDigits: 3 })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isCompleted && session ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              if (!confirm(t('confirm.delete_doc'))) return;
              auditSessionsApi
                .delete(apiClient, sessionId)
                .then(() => {
                  toast.success(t('toast.deleted'));
                  void qc.invalidateQueries({ queryKey: ['audit-sessions'] });
                  onClose();
                })
                .catch(() => toast.error(t('toast.delete_failed')));
            }}
            className={dangerBtnClass}
          >
            {t('actions.delete')}
          </button>
        </div>
      ) : null}
    </DocDetailModal>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
