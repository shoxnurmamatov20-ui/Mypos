'use client';

import type { LucideIcon } from 'lucide-react';
import { DollarSign, ShoppingBag, Table as TableIcon, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth';

interface StatCardData {
  key: 'orders' | 'revenue' | 'active_tables' | 'customers';
  icon: LucideIcon;
  value: string;
  delta: string;
  tone: 'brand' | 'mint' | 'gold' | 'purple';
}

const TONE_CLASSES: Record<StatCardData['tone'], string> = {
  brand: 'bg-brand-50 text-brand-600',
  mint: 'bg-mint-50 text-mint-600',
  gold: 'bg-gold-50 text-gold-600',
  purple: 'bg-purple-50 text-purple-600',
};

const STATS: StatCardData[] = [
  { key: 'orders', icon: ShoppingBag, value: '24', delta: '+12%', tone: 'brand' },
  { key: 'revenue', icon: DollarSign, value: '4,250,000', delta: '+8%', tone: 'mint' },
  { key: 'active_tables', icon: TableIcon, value: '7 / 18', delta: '39%', tone: 'gold' },
  { key: 'customers', icon: Users, value: '132', delta: '+5%', tone: 'purple' },
];

export function DashboardOverview() {
  const t = useTranslations('overview');
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-semibold text-neutral-900">
          {user ? t('welcome', { name: user.name }) : t('welcome_generic')}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-sm text-neutral-600">{t('more_coming')}</p>
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: StatCardData }) {
  const t = useTranslations('overview.stats');
  const Icon = stat.icon;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE_CLASSES[stat.tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-xs font-medium text-mint-600">{stat.delta}</span>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {t(stat.key)}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-neutral-900">{stat.value}</p>
    </div>
  );
}
