'use client';

import {
  type Payment,
  type PaymentProvider,
  type PaymentStatus,
  paymentsApi,
} from '@mypos/api-client';
import {
  Badge,
  type BadgeVariant,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  Select,
} from '@mypos/ui';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

const STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  pending: 'secondary',
  authorized: 'info',
  captured: 'success',
  failed: 'destructive',
  refunded: 'warning',
  cancelled: 'secondary',
};

const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  cash: '💵 Cash',
  card: '💳 Card',
  click: '⚡ Click',
  payme: '💜 Payme',
  uzum: '🟡 Uzum',
  apelsin: '🟠 Apelsin',
};

export function PaymentsClient() {
  const tSide = useTranslations('sidebar');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [provider, setProvider] = useState<PaymentProvider | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { status, provider, page }],
    queryFn: () =>
      paymentsApi.list(apiClient, {
        per_page: 20,
        ...(status ? { status } : {}),
        ...(provider ? { provider } : {}),
      }),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={tSide('payments')} description="Transaction log + refunds" />

      <FilterBar>
        <Select
          value={status}
          onChange={(v) => setStatus(v as PaymentStatus | '')}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'authorized', label: 'Authorized' },
            { value: 'captured', label: 'Captured' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          className="max-w-xs"
        />
        <Select
          value={provider}
          onChange={(v) => setProvider(v as PaymentProvider | '')}
          options={[
            { value: '', label: 'All providers' },
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Card' },
            { value: 'click', label: 'Click' },
            { value: 'payme', label: 'Payme' },
            { value: 'uzum', label: 'Uzum' },
            { value: 'apelsin', label: 'Apelsin' },
          ]}
          className="max-w-xs"
        />
        {meta ? (
          <div className="ml-auto text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
            {meta.total}
          </div>
        ) : null}
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            id: 'when',
            header: 'When',
            cell: (p: Payment) => (
              <span className="text-[12px] tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
              </span>
            ),
            width: '170px',
          },
          {
            id: 'order',
            header: 'Order',
            cell: (p: Payment) => (
              <span className="text-[12px] font-mono">{p.order_id.slice(0, 8)}</span>
            ),
          },
          {
            id: 'provider',
            header: 'Provider',
            cell: (p: Payment) => <span className="text-[12px]">{PROVIDER_LABEL[p.provider]}</span>,
          },
          {
            id: 'amount',
            header: 'Amount',
            cell: (p: Payment) => (
              <span className="font-semibold tabular-nums">
                {p.amount.toLocaleString('uz-UZ')} {p.currency}
              </span>
            ),
            align: 'right',
          },
          {
            id: 'txn',
            header: 'Transaction',
            cell: (p: Payment) => (
              <span className="text-[11px] font-mono text-[#62716d] dark:text-[#94a3b8] truncate max-w-[120px] block">
                {p.provider_transaction_id ?? '—'}
              </span>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (p: Payment) => <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>,
          },
        ]}
        rows={rows}
        rowKey={(p) => p.id}
        empty={<EmptyState icon={<CreditCard className="h-6 w-6" />} title="No payments yet" />}
      />

      {meta ? (
        <Pagination
          page={meta.current_page}
          totalPages={meta.last_page}
          onChange={setPage}
          total={meta.total}
          perPage={meta.per_page}
        />
      ) : null}
    </div>
  );
}
