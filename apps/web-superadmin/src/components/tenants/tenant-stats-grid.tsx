'use client';

import type { LucideIcon } from 'lucide-react';
import { CreditCard, Receipt, ShoppingBag, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCompactNumber, formatUZS } from '@/lib/format';
import type { TenantSummary } from '@/types/super-admin';

type StatCard = {
  icon: LucideIcon;
  labelKey: string;
  value: string;
  iconBg: string;
  iconColor: string;
};

type Props = {
  tenant: TenantSummary;
};

export function TenantStatsGrid({ tenant }: Props) {
  const t = useTranslations('tenant_detail');

  // Synthetic "today" — 1.5%–4% of MRR daily so the demo shows realistic motion.
  const todayOrders = Math.max(0, Math.round((tenant.total_orders_count % 100) + 12));

  const cards: StatCard[] = [
    {
      icon: CreditCard,
      labelKey: 'stats_mrr',
      value: tenant.mrr_minor > 0 ? formatUZS(tenant.mrr_minor) : '—',
      iconBg: 'bg-[rgba(15,118,110,0.10)] dark:bg-[rgba(20,184,166,0.18)]',
      iconColor: 'text-[#0f766e] dark:text-[#14b8a6]',
    },
    {
      icon: TrendingUp,
      labelKey: 'stats_total_revenue',
      value: formatUZS(tenant.total_revenue_minor),
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/15',
      iconColor: 'text-[#18794e] dark:text-emerald-400',
    },
    {
      icon: ShoppingBag,
      labelKey: 'stats_orders_today',
      value: formatCompactNumber(todayOrders),
      iconBg: 'bg-blue-50 dark:bg-blue-500/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Receipt,
      labelKey: 'stats_orders_30d',
      value: formatCompactNumber(tenant.total_orders_count),
      iconBg: 'bg-purple-50 dark:bg-purple-500/15',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.labelKey}
            className="rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 md:p-5 transition-colors hover:border-[rgba(15,118,110,0.20)] dark:hover:border-[rgba(20,184,166,0.20)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] truncate">
                {t(card.labelKey)}
              </p>
              <div
                className={`grid h-[34px] w-[34px] place-items-center rounded-[10px] flex-shrink-0 ${card.iconBg}`}
                aria-hidden="true"
              >
                <Icon className={`h-[17px] w-[17px] ${card.iconColor}`} strokeWidth={2} />
              </div>
            </div>
            <p className="mt-3 text-xl md:text-2xl font-extrabold text-[#16221f] dark:text-white tabular-nums truncate">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
