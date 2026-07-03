'use client';

import { type Customer, customersApi, type LoyaltyTier } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { CustomerFormDialog } from './customer-form-dialog';

const TIER_CLASS: Record<LoyaltyTier, string> = {
  bronze: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  silver: 'bg-[#eef4f3] dark:bg-[#1a2235] text-[#62716d] dark:text-[#94a3b8]',
  gold: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  platinum: 'bg-teal-50 dark:bg-teal-950/50 text-[#0f766e] dark:text-teal-400',
};

export function CustomerList({
  customers,
  isLoading,
  onChanged,
}: {
  customers: Customer[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('customers');
  const [editing, setEditing] = useState<Customer | 'new' | null>(null);

  const handleDelete = async (c: Customer) => {
    if (!confirm(t('confirm_delete', { name: c.full_name }))) return;
    try {
      await customersApi.delete(apiClient, c.id);
      toast.success(t('deleted'));
      onChanged();
    } catch {
      toast.error(t('delete_failed'));
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white"
        >
          + {t('add_customer')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('loading')}</div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)] p-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
          {t('empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((c) => {
            const tier = c.loyalty_account?.tier ?? null;
            const initials = (c.first_name[0] ?? '') + (c.last_name?.[0] ?? '');
            return (
              <div
                key={c.id}
                className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 font-semibold text-[#0f766e] dark:text-teal-400">
                    {initials.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-[#16221f] dark:text-white">
                      {c.full_name}
                    </h3>
                    <p className="truncate text-sm text-[#62716d] dark:text-[#94a3b8]">{c.phone}</p>
                    {c.email && (
                      <p className="truncate text-xs text-[#62716d] dark:text-[#94a3b8]">
                        {c.email}
                      </p>
                    )}
                  </div>
                  {tier && (
                    <span
                      className={'rounded-full px-2 py-0.5 text-xs font-medium ' + TIER_CLASS[tier]}
                    >
                      {t(`tier.${tier}`)}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-[#eef4f3] dark:bg-[#1a2235] px-3 py-2 text-xs">
                  <span className="text-[#62716d] dark:text-[#94a3b8]">
                    {c.total_orders} {t('orders_short')}
                  </span>
                  <span className="font-semibold text-[#16221f] dark:text-[#e2e8f0]">
                    {formatUZS(c.total_spent)}
                  </span>
                </div>

                {c.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="font-medium text-[#0f766e] dark:text-teal-400 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== null && (
        <CustomerFormDialog
          customer={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
