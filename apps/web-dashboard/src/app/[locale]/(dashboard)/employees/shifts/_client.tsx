'use client';

import { shiftsApi, type Shift, type ShiftStatus } from '@mypos/api-client';
import {
  Badge,
  type BadgeVariant,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  Select,
} from '@mypos/ui';
import { useQuery } from '@tanstack/react-query';
import { Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

const STATUS_VARIANT: Record<ShiftStatus, BadgeVariant> = {
  scheduled: 'secondary',
  open: 'success',
  closed: 'info',
  missed: 'destructive',
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString() : '—';
}

export function ShiftsClient() {
  const t = useTranslations('shifts');
  const tSide = useTranslations('sidebar');
  const [status, setStatus] = useState<ShiftStatus | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['shifts', { status }],
    queryFn: () => shiftsApi.list(apiClient, status ? { status } : undefined),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={tSide('shifts')} />

      <FilterBar>
        <Select
          value={status}
          onChange={(v) => setStatus(v as ShiftStatus | '')}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'scheduled', label: t('status.scheduled') },
            { value: 'open', label: t('status.open') },
            { value: 'closed', label: t('status.closed') },
            { value: 'missed', label: t('status.missed') },
          ]}
          className="max-w-xs"
        />
        <div className="ml-auto text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
          {rows.length}
        </div>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            id: 'employee',
            header: 'Employee',
            cell: (s: Shift) => (
              <div>
                <p className="font-semibold">{s.employee?.name ?? '—'}</p>
                <p className="text-[11px] font-mono text-[#62716d] dark:text-[#94a3b8]">
                  {s.employee?.employee_code ?? ''}
                </p>
              </div>
            ),
          },
          {
            id: 'position',
            header: 'Position',
            cell: (s: Shift) => (
              <span className="text-[12px] capitalize">{s.employee?.position ?? '—'}</span>
            ),
          },
          {
            id: 'scheduled_start',
            header: t('scheduled_start'),
            cell: (s: Shift) => (
              <span className="text-[12px] tabular-nums">{fmt(s.scheduled_start)}</span>
            ),
          },
          {
            id: 'actual_start',
            header: t('actual_start'),
            cell: (s: Shift) => (
              <span className="text-[12px] tabular-nums">{fmt(s.actual_start)}</span>
            ),
          },
          {
            id: 'actual_end',
            header: t('actual_end'),
            cell: (s: Shift) => (
              <span className="text-[12px] tabular-nums">{fmt(s.actual_end)}</span>
            ),
          },
          {
            id: 'status',
            header: t('status_col'),
            cell: (s: Shift) => (
              <Badge variant={STATUS_VARIANT[s.status.value]}>{s.status.label}</Badge>
            ),
          },
        ]}
        rows={rows}
        rowKey={(s) => s.id}
        empty={<EmptyState icon={<Timer className="h-6 w-6" />} title={t('empty')} />}
      />
    </div>
  );
}
