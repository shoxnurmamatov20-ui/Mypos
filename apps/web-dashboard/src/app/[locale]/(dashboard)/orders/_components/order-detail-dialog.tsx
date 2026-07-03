'use client';

import { ApiError, type Order, type OrderStatus, ordersApi } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { OrderItemsTable } from './order-items-table';
import { AmountsBreakdown, Timestamps } from './order-summary-panels';
import { StatusBadge } from './status-badge';
import { StatusStepper } from './status-stepper';

type NextStep =
  | { next: 'preparing'; labelKey: 'actions.start_preparing' }
  | { next: 'ready'; labelKey: 'actions.mark_ready' }
  | { next: 'served'; labelKey: 'actions.mark_served' }
  | { next: 'completed'; labelKey: 'actions.complete' };

function nextStatus(status: OrderStatus): NextStep | null {
  switch (status) {
    case 'pending':
      return { next: 'preparing', labelKey: 'actions.start_preparing' };
    case 'preparing':
      return { next: 'ready', labelKey: 'actions.mark_ready' };
    case 'ready':
      return { next: 'served', labelKey: 'actions.mark_served' };
    case 'served':
      return { next: 'completed', labelKey: 'actions.complete' };
    default:
      return null;
  }
}

export function OrderDetailDialog({
  order,
  onClose,
  onChanged,
}: {
  order: Order;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations('orders');
  const [pending, setPending] = useState(false);

  const changeStatus = async (next: OrderStatus): Promise<void> => {
    setPending(true);
    try {
      await ordersApi.updateStatus(apiClient, order.id, { status: next });
      toast.success(t('updated'));
      onChanged();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        toast.error(body?.message ?? t('update_failed'));
      } else {
        toast.error(t('update_failed'));
      }
    } finally {
      setPending(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!confirm(t('confirm_cancel', { orderNo: order.order_no }))) return;
    await changeStatus('cancelled');
  };

  const handlePrint = (): void => {
    toast.info(t('print_not_implemented'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader order={order} onClose={onClose} />

        <div className="mb-6">
          <StatusStepper status={order.status} />
        </div>

        <section className="mb-6">
          <SectionTitle>{t('detail.items')}</SectionTitle>
          <OrderItemsTable items={order.items} />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <SectionTitle>{t('detail.amounts')}</SectionTitle>
            <AmountsBreakdown order={order} />
          </div>
          <div>
            <SectionTitle>{t('detail.timestamps')}</SectionTitle>
            <Timestamps order={order} />
          </div>
        </section>

        {order.notes && (
          <section className="mb-6">
            <SectionTitle>{t('detail.notes')}</SectionTitle>
            <p className="rounded-lg bg-[#eef4f3] px-3 py-2 text-sm text-[#16221f] dark:bg-[#1a2235] dark:text-[#e2e8f0]">
              {order.notes}
            </p>
          </section>
        )}

        <ActionsBar
          order={order}
          pending={pending}
          onChangeStatus={changeStatus}
          onCancel={handleCancel}
          onPrint={handlePrint}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#62716d] dark:text-[#94a3b8]">
      {children}
    </h3>
  );
}

function DialogHeader({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations('orders');
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b border-[rgba(22,34,31,0.09)] pb-4 dark:border-[rgba(255,255,255,0.07)]">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#16221f] dark:text-white">#{order.order_no}</h2>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t(`filters.type.${order.type}` as 'filters.type.dine_in')}
          {order.table ? ` \u00b7 ${t('table')}: ${order.table.name}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="rounded-lg p-2 text-[#62716d] hover:bg-[#eef4f3] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white"
      >
        {'\u2715'}
      </button>
    </div>
  );
}

function ActionsBar({
  order,
  pending,
  onChangeStatus,
  onCancel,
  onPrint,
  onClose,
}: {
  order: Order;
  pending: boolean;
  onChangeStatus: (s: OrderStatus) => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  onPrint: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('orders');
  const canCancel =
    order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'refunded';

  const nextStep = nextStatus(order.status);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[rgba(22,34,31,0.09)] pt-4 dark:border-[rgba(255,255,255,0.07)]">
      <button
        type="button"
        onClick={onPrint}
        className="rounded-lg border border-[rgba(22,34,31,0.09)] px-4 py-2 text-sm font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]"
      >
        {t('actions.print_receipt')}
      </button>
      {canCancel && (
        <button
          type="button"
          onClick={() => void onCancel()}
          disabled={pending}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {t('actions.cancel')}
        </button>
      )}
      {nextStep && (
        <button
          type="button"
          onClick={() => void onChangeStatus(nextStep.next)}
          disabled={pending}
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5e58] disabled:opacity-60 dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
        >
          {pending ? t('updating') : t(nextStep.labelKey as 'actions.start_preparing')}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-[rgba(22,34,31,0.09)] px-4 py-2 text-sm font-medium text-[#16221f] hover:bg-[#eef4f3] dark:border-[rgba(255,255,255,0.07)] dark:text-[#e2e8f0] dark:hover:bg-[#1a2235]"
      >
        {t('close')}
      </button>
    </div>
  );
}
