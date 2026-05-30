'use client';

import {
  notificationsApi,
  type NotificationChannel,
  type NotificationLog,
  type NotificationStatus,
} from '@mypos/api-client';
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
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

const STATUS_VARIANT: Record<NotificationStatus, BadgeVariant> = {
  queued: 'secondary',
  sent: 'info',
  delivered: 'success',
  read: 'teal',
  failed: 'destructive',
};

export function NotificationsLogClient() {
  const tCommon = useTranslations('common');
  const tSide = useTranslations('sidebar');
  const [channel, setChannel] = useState<NotificationChannel | ''>('');
  const [status, setStatus] = useState<NotificationStatus | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-log', { channel, status }],
    queryFn: () =>
      notificationsApi.list(apiClient, {
        per_page: 50,
        ...(channel ? { channel } : {}),
        ...(status ? { status } : {}),
      }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={tSide('notifications_log')} />

      <FilterBar>
        <Select
          value={channel}
          onChange={(v) => setChannel(v as NotificationChannel | '')}
          options={[
            { value: '', label: 'All channels' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'push', label: 'Push' },
            { value: 'telegram', label: 'Telegram' },
            { value: 'in_app', label: 'In-app' },
          ]}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(v) => setStatus(v as NotificationStatus | '')}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'queued', label: 'Queued' },
            { value: 'sent', label: 'Sent' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'read', label: 'Read' },
            { value: 'failed', label: 'Failed' },
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
            id: 'created',
            header: 'Sent',
            cell: (n: NotificationLog) => (
              <span className="text-[12px] tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                {new Date(n.created_at).toLocaleString()}
              </span>
            ),
            width: '170px',
          },
          {
            id: 'channel',
            header: 'Channel',
            cell: (n: NotificationLog) => <Badge variant="info">{n.channel}</Badge>,
          },
          {
            id: 'template',
            header: 'Template',
            cell: (n: NotificationLog) => <span className="text-[12px]">{n.template}</span>,
          },
          {
            id: 'recipient',
            header: 'Recipient',
            cell: (n: NotificationLog) => (
              <span className="text-[12px] text-[#16221f] dark:text-[#e2e8f0]">{n.recipient}</span>
            ),
          },
          {
            id: 'subject',
            header: 'Subject',
            cell: (n: NotificationLog) => (
              <span className="text-[12px] truncate max-w-[200px] block">
                {n.subject ?? '—'}
              </span>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (n: NotificationLog) => (
              <Badge variant={STATUS_VARIANT[n.status]}>{n.status}</Badge>
            ),
          },
        ]}
        rows={rows}
        rowKey={(n) => n.id}
        empty={<EmptyState icon={<Bell className="h-6 w-6" />} title={tCommon('error')} />}
      />
    </div>
  );
}
