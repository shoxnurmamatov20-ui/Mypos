'use client';

import type { PaymentMethodStat, TopItem, TopTable } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import type { LucideIcon } from 'lucide-react';
import { CreditCard, Table2, UtensilsCrossed } from 'lucide-react';
import { useTranslations } from 'next-intl';

type RankRow = {
  key: string;
  name: string;
  metric: string;
  value: string;
  /** 0–100, drives the inline progress bar. */
  fillPct: number;
};

/** Shared ranked-list card — index badge + name + metric + fill bar. */
function RankCard({
  icon: Icon,
  title,
  rows,
  emptyLabel,
}: {
  icon: LucideIcon;
  title: string;
  rows: RankRow[];
  emptyLabel: string;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-[rgba(22,34,31,0.09)] bg-white p-5 transition-colors dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <header className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef4f3] text-[#0f766e] dark:bg-[#1a2235] dark:text-teal-400">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        <h3 className="text-base font-semibold tracking-tight text-[#16221f] dark:text-white">
          {title}
        </h3>
      </header>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-[#62716d] dark:text-[#94a3b8]">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => (
            <li key={row.key}>
              <div className="flex items-center gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#eef4f3] text-[11px] font-bold tabular-nums text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#16221f] dark:text-[#e2e8f0]">
                  {row.name}
                </span>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#16221f] dark:text-white">
                  {row.value}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 pl-[30px]">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(22,34,31,0.06)] dark:bg-[rgba(255,255,255,0.06)]">
                  <div
                    className="h-full rounded-full bg-[#0f766e] dark:bg-teal-500"
                    style={{ width: `${Math.max(4, Math.min(100, row.fillPct))}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                  {row.metric}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Props = {
  topItems: TopItem[];
  topTables: TopTable[];
  paymentMethods: PaymentMethodStat[];
};

/**
 * Three ranked-list cards — best-selling menu items, busiest tables and
 * the payment-method split — rendered as a responsive 3-column row.
 */
export function OverviewRankings({ topItems, topTables, paymentMethods }: Props) {
  const t = useTranslations('overview');

  const items = topItems.slice(0, 5);
  const maxItemCount = Math.max(1, ...items.map((i) => i.count));
  const itemRows: RankRow[] = items.map((i) => ({
    key: i.menu_item_id ?? i.name,
    name: i.name,
    metric: formatUZS(i.revenue),
    value: `${i.count} ${t('labels.count').toLowerCase()}`,
    fillPct: (i.count / maxItemCount) * 100,
  }));

  const tables = topTables.slice(0, 5);
  const maxTableOrders = Math.max(1, ...tables.map((tb) => tb.orders));
  const tableRows: RankRow[] = tables.map((tb) => ({
    key: tb.table_id ?? tb.name,
    name: tb.name,
    metric: formatUZS(tb.revenue),
    value: `${tb.orders} ${t('labels.orders').toLowerCase()}`,
    fillPct: (tb.orders / maxTableOrders) * 100,
  }));

  const payTotal = Math.max(
    1,
    paymentMethods.reduce((sum, p) => sum + p.revenue, 0),
  );
  const knownMethods = new Set(['cash', 'card', 'click', 'payme', 'uzum']);
  const payRows: RankRow[] = [...paymentMethods]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => {
      const methodKey = knownMethods.has(p.method) ? p.method : 'other';
      return {
        key: p.method,
        name: t(`payment.${methodKey}`),
        metric: `${Math.round((p.revenue / payTotal) * 100)}%`,
        value: formatUZS(p.revenue),
        fillPct: (p.revenue / payTotal) * 100,
      };
    });

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      <RankCard
        icon={UtensilsCrossed}
        title={t('sections.top_items')}
        rows={itemRows}
        emptyLabel={t('empty')}
      />
      <RankCard
        icon={Table2}
        title={t('sections.top_tables')}
        rows={tableRows}
        emptyLabel={t('empty')}
      />
      <RankCard
        icon={CreditCard}
        title={t('sections.payment_methods')}
        rows={payRows}
        emptyLabel={t('empty')}
      />
    </div>
  );
}
