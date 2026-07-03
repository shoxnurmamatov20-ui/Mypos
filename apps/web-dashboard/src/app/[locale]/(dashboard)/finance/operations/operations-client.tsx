'use client';

import { cn } from '@mypos/ui';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type FinanceKind, useFinanceHydrated, useFinanceStore } from '@/stores/finance';
import {
  inputClass,
  primaryBtnClass,
  SegmentedControl,
  type SegmentOption,
  SettingsCard,
  SettingsSkeleton,
} from '../../settings/_components/settings-ui';
import { OperationFormDialog } from './operation-form-dialog';

const fmt = (n: number) => n.toLocaleString('uz-UZ');
type KindFilter = FinanceKind | 'all';

export function OperationsClient() {
  const hydrated = useFinanceHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <OperationsInner />;
}

function OperationsInner() {
  const t = useTranslations('finance');
  const operations = useFinanceStore((s) => s.operations);
  const categories = useFinanceStore((s) => s.categories);
  const deleteOperation = useFinanceStore((s) => s.deleteOperation);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  const filtered = useMemo(
    () =>
      operations.filter((o) => {
        if (kindFilter !== 'all' && o.kind !== kindFilter) return false;
        if (categoryId !== 'all' && o.categoryId !== categoryId) return false;
        if (from && o.date < from) return false;
        if (to && o.date > to) return false;
        return true;
      }),
    [operations, kindFilter, categoryId, from, to],
  );

  const totalIncome = useMemo(
    () => filtered.filter((o) => o.kind === 'income').reduce((s, o) => s + o.amount, 0),
    [filtered],
  );
  const totalExpense = useMemo(
    () => filtered.filter((o) => o.kind === 'expense').reduce((s, o) => s + o.amount, 0),
    [filtered],
  );
  const net = totalIncome - totalExpense;

  const kindOptions: readonly SegmentOption<KindFilter>[] = [
    { value: 'all', label: t('operations.filter_all') },
    { value: 'income', label: t('kind.income') },
    { value: 'expense', label: t('kind.expense') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label={t('overview.total_income')} value={fmt(totalIncome)} tone="income" />
        <Kpi label={t('overview.total_expense')} value={fmt(totalExpense)} tone="expense" />
        <Kpi
          label={t('overview.net_profit')}
          value={fmt(net)}
          tone={net >= 0 ? 'income' : 'expense'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={kindOptions}
          value={kindFilter}
          onChange={(v) => {
            setKindFilter(v);
            setCategoryId('all');
          }}
        />
        <select
          className={cn(inputClass, 'w-auto')}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label={t('category')}
        >
          <option value="all">{t('operations.filter_all')}</option>
          {(kindFilter === 'all'
            ? categories
            : categories.filter((c) => c.kind === kindFilter)
          ).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className={cn(inputClass, 'w-auto')}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label={t('date')}
        />
        <input
          type="date"
          className={cn(inputClass, 'w-auto')}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label={t('date')}
        />
        <button
          type="button"
          className={cn(primaryBtnClass, 'ml-auto inline-flex items-center gap-1.5')}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" /> {t('operations.add')}
        </button>
      </div>

      <SettingsCard>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('operations.empty')}
          </p>
        ) : (
          <div className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
            {filtered.map((o) => {
              const inc = o.kind === 'income';
              const Icon = inc ? ArrowDownLeft : ArrowUpRight;
              return (
                <div key={o.id} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                      inc
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
                      {catName(o.categoryId)}
                    </p>
                    <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                      {o.date}
                      {o.note ? ` · ${o.note}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 text-sm font-semibold tabular-nums [font-feature-settings:'tnum']",
                      inc
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {inc ? '+' : '−'}
                    {fmt(o.amount)} so'm
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteOperation(o.id);
                      toast.success(t('operations.op_deleted'));
                    }}
                    className="flex-shrink-0 rounded-lg p-2 text-[#62716d] transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:text-[#94a3b8] dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                    aria-label={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SettingsCard>

      {dialogOpen && (
        <OperationFormDialog
          onClose={() => setDialogOpen(false)}
          onSaved={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: 'income' | 'expense' }) {
  return (
    <div className="rounded-2xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white p-4 dark:bg-[#111827]">
      <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums [font-feature-settings:'tnum']",
          tone === 'income'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400',
        )}
      >
        {value} so'm
      </p>
    </div>
  );
}
