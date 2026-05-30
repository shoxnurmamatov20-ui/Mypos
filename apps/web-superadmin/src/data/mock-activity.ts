import type { AuditEntry, SystemHealth } from '@/types/super-admin';

/**
 * Synthetic audit-log feed used until the backend exposes the real one.
 * Entries are ordered newest-first; timestamps are pinned to fixed offsets
 * from "now" via `relativeIso(minutesAgo)` so the UI shows realistic
 * "x minutes ago" labels regardless of when the page is loaded.
 */
const relativeIso = (minutesAgo: number): string =>
  new Date(Date.now() - minutesAgo * 60_000).toISOString();

export const MOCK_ACTIVITY_FEED: AuditEntry[] = [
  {
    id: 'a1',
    action_key: 'tenant_suspended',
    actor: 'Admin Akbar',
    subject: 'Shashlik Grand',
    severity: 'critical',
    created_at: relativeIso(8),
  },
  {
    id: 'a2',
    action_key: 'plan_upgraded',
    actor: 'Admin Dilshod',
    subject: 'Samarqand Palov → Business',
    severity: 'info',
    created_at: relativeIso(34),
  },
  {
    id: 'a3',
    action_key: 'payment_failed',
    actor: 'System',
    subject: 'Pizza Tashkent',
    severity: 'warning',
    created_at: relativeIso(72),
  },
  {
    id: 'a4',
    action_key: 'tenant_created',
    actor: 'Self-signup',
    subject: 'Cafe Bukhara',
    severity: 'info',
    created_at: relativeIso(180),
  },
  {
    id: 'a5',
    action_key: 'login_failed',
    actor: 'unknown@example.uz',
    subject: '5 attempts',
    severity: 'error',
    created_at: relativeIso(245),
  },
  {
    id: 'a6',
    action_key: 'plan_downgraded',
    actor: 'Owner Bobur',
    subject: 'Choyxona VIP → Pro',
    severity: 'warning',
    created_at: relativeIso(360),
  },
  {
    id: 'a7',
    action_key: 'admin_invited',
    actor: 'Owner',
    subject: 'finance@mypos.uz',
    severity: 'info',
    created_at: relativeIso(540),
  },
  {
    id: 'a8',
    action_key: 'tenant_resumed',
    actor: 'Admin Akbar',
    subject: 'Lavash King',
    severity: 'info',
    created_at: relativeIso(720),
  },
  {
    id: 'a9',
    action_key: 'database_backup',
    actor: 'System',
    subject: 'Daily snapshot completed',
    severity: 'info',
    created_at: relativeIso(870),
  },
  {
    id: 'a10',
    action_key: 'feature_flag_toggled',
    actor: 'Developer',
    subject: 'ai_summary → enabled',
    severity: 'info',
    created_at: relativeIso(1080),
  },
];

/**
 * System-health snapshot. Numbers are illustrative — the real endpoint
 * will surface live Prometheus / Grafana scrapes.
 */
export const MOCK_SYSTEM_HEALTH: SystemHealth = {
  uptime_pct: 99.97,
  metrics: [
    { label_key: 'metric_response', value: '142 ms', status: 'ok' },
    { label_key: 'metric_errors', value: '12', status: 'ok' },
    { label_key: 'metric_connections', value: '1 248', status: 'ok' },
    { label_key: 'metric_db', value: '8 ms', status: 'ok' },
  ],
};
