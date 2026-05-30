import type { DashboardKpis, MockRevenuePoint } from '@/types/super-admin';

export const MOCK_DASHBOARD_KPIS: DashboardKpis = {
  mrr_minor: {
    value: 336_900_000,
    previous: 312_400_000,
    trend_pct: 7.8,
  },
  active_tenants: {
    value: 8,
    previous: 7,
    trend_pct: 14.3,
  },
  total_orders: {
    value: 165_388,
    previous: 152_900,
    trend_pct: 8.2,
  },
  nrr_pct: {
    value: 108.4,
    previous: 104.2,
    trend_pct: 4.0,
  },
  trialing_tenants: 2,
  at_risk_tenants: 2,
};

/**
 * 30 days of synthetic revenue + order counts. Values trend slightly up to
 * give the dashboard sparkline a positive gradient. Replace with API data
 * once `/api/v1/super-admin/dashboard/revenue` is live.
 */
export const MOCK_REVENUE_CHART: MockRevenuePoint[] = Array.from({ length: 30 }, (_, idx) => {
  // Day index 0 → 29 days ago, 29 → today.
  const day = new Date();
  day.setDate(day.getDate() - (29 - idx));
  const isoDate = day.toISOString().slice(0, 10);

  // Base trend: smooth growth from ~9M to ~13M so'm/day. Slight oscillation.
  const base = 9_000_000_000 + idx * 130_000_000;
  const wave = Math.sin(idx / 3.2) * 600_000_000;
  const noise = ((idx * 7919) % 11) * 40_000_000;
  const revenue_minor = Math.round(base + wave + noise);

  const ordersBase = 4_800 + idx * 45;
  const ordersWave = Math.sin(idx / 2.8) * 280;
  const ordersNoise = ((idx * 6151) % 13) * 18;
  const orders = Math.round(ordersBase + ordersWave + ordersNoise);

  return { date: isoDate, revenue_minor, orders };
});
