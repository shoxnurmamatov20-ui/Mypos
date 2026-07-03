'use client';

import { type AuditSession, type AuditStatus, auditSessionsApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, ClipboardList, Eye, PlayCircle, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DashStatCard } from '../../_components/stat-card';
import { AuditSessionDetail } from '../_components/audit-session-detail';
import { AuditSessionForm } from '../_components/audit-session-form';
import { formatDateTime, startOfMonth } from '../_components/format';
import { StatusBadge } from '../_components/status-badge';
import {
  EmptyState,
  ErrorBanner,
  primaryBtnClass,
  StatStripSkeleton,
  TableSkeleton,
} from '../_components/ui-helpers';

export function AuditView() {
  const t = useTranslations('inventory');

  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['audit-sessions', 'list'],
    queryFn: () => auditSessionsApi.list(apiClient, { per_page: 50 }),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const sessions: AuditSession[] = listQuery.data?.data ?? [];

  const monthStart = startOfMonth();

  const stats = useMemo(() => {
    let inProgress = 0;
    let completedMonth = 0;
    let totalDiscrepancy = 0;
    for (const s of sessions) {
      if (s.status === 'in_progress') inProgress += 1;
      if (s.status === 'completed' && s.completed_at && s.completed_at.slice(0, 10) >= monthStart) {
        completedMonth += 1;
      }
      totalDiscrepancy += s.discrepancy_count ?? 0;
    }
    return { inProgress, completedMonth, totalDiscrepancy };
  }, [sessions, monthStart]);

  return (
    <>
      {listQuery.isLoading ? (
        <StatStripSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DashStatCard
            label={t('status.in_progress')}
            value={String(stats.inProgress)}
            icon={ClipboardList}
            accent="blue"
            fillPct={100}
          />
          <DashStatCard
            label={t('status.completed')}
            value={String(stats.completedMonth)}
            icon={CheckCircle2}
            accent="green"
            fillPct={100}
          />
          <DashStatCard
            label={t('fields.discrepancy')}
            value={String(stats.totalDiscrepancy)}
            icon={ClipboardCheck}
            accent="violet"
            fillPct={100}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end">
        <button type="button" onClick={() => setCreating(true)} className={primaryBtnClass}>
          <Plus className="h-4 w-4" />
          {t('actions.new_audit')}
        </button>
      </div>

      {listQuery.isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : listQuery.isError ? (
        <ErrorBanner onRetry={() => void listQuery.refetch()} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={t('empty.audit')}
          action={
            <button type="button" onClick={() => setCreating(true)} className={primaryBtnClass}>
              <Plus className="h-4 w-4" />
              {t('actions.new_audit')}
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#eef4f3] text-xs uppercase text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-3 text-left">{t('fields.doc_no')}</th>
                <th className="px-4 py-3 text-left">{t('fields.warehouse')}</th>
                <th className="px-4 py-3 text-left">{t('fields.started_at')}</th>
                <th className="px-4 py-3 text-left">{t('fields.completed_at')}</th>
                <th className="px-4 py-3 text-left">{t('fields.conducted_by')}</th>
                <th className="px-4 py-3 text-right">{t('fields.discrepancy')}</th>
                <th className="px-4 py-3 text-left">{t('fields.status')}</th>
                <th className="px-4 py-3 text-right">{t('fields.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
                  onClick={() => setActiveId(s.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#16221f] dark:text-white">
                    {s.doc_no}
                  </td>
                  <td className="px-4 py-3 text-[#16221f] dark:text-white">
                    {s.warehouse?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#16221f] dark:text-white">
                    {formatDateTime(s.started_at)}
                  </td>
                  <td className="px-4 py-3 text-[#62716d] dark:text-[#94a3b8]">
                    {formatDateTime(s.completed_at)}
                  </td>
                  <td className="px-4 py-3 text-[#16221f] dark:text-white">
                    {s.conductor?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {s.discrepancy_count > 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {s.discrepancy_count}
                      </span>
                    ) : (
                      <span className="text-[#62716d] dark:text-[#94a3b8]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status as AuditStatus} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveId(s.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#eef4f3] px-2.5 py-1.5 text-xs font-semibold text-[#0f766e] hover:bg-[#dceae7] dark:bg-[#1a2235] dark:text-teal-400 dark:hover:bg-[#0d1424]"
                      >
                        {s.status === 'in_progress' ? (
                          <>
                            <PlayCircle className="h-3.5 w-3.5" />
                            {t('actions.continue')}
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            {t('actions.view')}
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating ? (
        <AuditSessionForm onClose={() => setCreating(false)} onCreated={(id) => setActiveId(id)} />
      ) : null}
      {activeId ? (
        <AuditSessionDetail sessionId={activeId} onClose={() => setActiveId(null)} />
      ) : null}
    </>
  );
}
