'use client';

import { customersApi, type Customer, type LoyaltyTier } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { CustomerFormDialog } from './customer-form-dialog';

const TIER_CLASS: Record<LoyaltyTier, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-neutral-100 text-neutral-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-sky-100 text-sky-800',
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
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + {t('add_customer')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500">{t('loading')}</div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
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
                className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                    {initials.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-neutral-900">{c.full_name}</h3>
                    <p className="truncate text-sm text-neutral-500">{c.phone}</p>
                    {c.email && (
                      <p className="truncate text-xs text-neutral-400">{c.email}</p>
                    )}
                  </div>
                  {tier && (
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-xs font-medium ' + TIER_CLASS[tier]
                      }
                    >
                      {t(`tier.${tier}`)}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                  <span className="text-neutral-500">
                    {c.total_orders} {t('orders_short')}
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {formatUZS(c.total_spent)}
                  </span>
                </div>

                {c.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-mint-100 px-2 py-0.5 text-xs text-mint-700"
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
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="font-medium text-danger hover:underline"
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
