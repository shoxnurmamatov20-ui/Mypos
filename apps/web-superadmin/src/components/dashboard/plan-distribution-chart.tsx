'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import type { TenantPlan, TenantSummary } from '@/types/super-admin';

type PlanDistributionChartProps = {
  tenants: TenantSummary[];
};

const PLAN_ORDER: TenantPlan[] = ['free', 'starter', 'pro', 'business', 'enterprise'];

const PLAN_COLORS: Record<TenantPlan, string> = {
  free: '#94a3b8',
  starter: '#60a5fa',
  pro: '#0f766e',
  business: '#8b5cf6',
  enterprise: '#ec4899',
};

type Slice = {
  plan: TenantPlan;
  count: number;
  color: string;
};

export function PlanDistributionChart({ tenants }: PlanDistributionChartProps) {
  const t = useTranslations('dashboard.charts');
  const tPlans = useTranslations('dashboard.tenant_plans');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const stroke = isDark ? '#0b1120' : '#fff';

  const slices = useMemo<Slice[]>(() => {
    const counts = PLAN_ORDER.reduce<Record<TenantPlan, number>>(
      (acc, plan) => {
        acc[plan] = 0;
        return acc;
      },
      { free: 0, starter: 0, pro: 0, business: 0, enterprise: 0 },
    );
    for (const tenant of tenants) counts[tenant.plan]++;
    return PLAN_ORDER.map((plan) => ({
      plan,
      count: counts[plan],
      color: PLAN_COLORS[plan],
    })).filter((s) => s.count > 0);
  }, [tenants]);

  const total = slices.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle hint={t('plans_subtitle', { count: formatNumber(total) })}>
          {t('plans_title')}
        </CardTitle>
      </CardHeader>

      <div className="relative h-[180px] md:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="plan"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
              stroke={stroke}
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.plan} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? 'rgba(11,17,32,0.95)' : 'rgba(255,255,255,0.95)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(22,34,31,0.09)'}`,
                borderRadius: 10,
                fontSize: 12,
                padding: '8px 12px',
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,0,0,0.4)'
                  : '0 4px 20px rgba(18,34,31,0.08)',
              }}
              labelStyle={{ color: isDark ? '#94a3b8' : '#62716d' }}
              itemStyle={{ color: isDark ? '#fff' : '#16221f' }}
              formatter={(value: number, _name, item) => [
                `${formatNumber(value)} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`,
                tPlans(item?.payload?.plan as TenantPlan),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered total badge */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-extrabold text-[#16221f] dark:text-white tabular-nums leading-none">
            {formatNumber(total)}
          </p>
          <p className="text-xs text-[#62716d] dark:text-[#94a3b8] mt-1">tenants</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {slices.map((slice) => {
          const pct = total > 0 ? (slice.count / total) * 100 : 0;
          return (
            <li
              key={slice.plan}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2 text-[#16221f] dark:text-gray-300 min-w-0">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{tPlans(slice.plan)}</span>
              </span>
              <span className="flex items-baseline gap-2 tabular-nums flex-shrink-0">
                <span className="font-bold text-[#16221f] dark:text-white">
                  {formatNumber(slice.count)}
                </span>
                <span className="text-xs text-[#62716d] dark:text-[#94a3b8]">{pct.toFixed(1)}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
