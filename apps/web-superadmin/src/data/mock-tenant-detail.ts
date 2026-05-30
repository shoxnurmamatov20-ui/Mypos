/**
 * Mock data for the tenant detail page until the dedicated `/api/v1/super-
 * admin/tenants/:id/...` endpoints land. Each helper takes the tenant id so
 * the values change deterministically per tenant — keeps the fixtures
 * believable while the data is synthetic.
 */

export type MockOrder = {
  id: string;
  order_no: string;
  status: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
  total_minor: number;
  created_at: string;
};

export type MockAuditEvent = {
  id: string;
  type:
    | 'login'
    | 'plan_change'
    | 'subscription_renewed'
    | 'order_completed'
    | 'payment';
  actor: string;
  detail?: string;
  created_at: string;
};

const ORDER_STATUSES: MockOrder['status'][] = [
  'pending',
  'preparing',
  'served',
  'paid',
  'paid',
  'cancelled',
];

const AUDIT_TYPES: MockAuditEvent['type'][] = [
  'login',
  'plan_change',
  'subscription_renewed',
  'order_completed',
  'payment',
];

/** Simple, fast deterministic hash → produces stable per-tenant fixtures. */
function seed(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function buildMockOrders(tenantId: string, count = 5): MockOrder[] {
  return Array.from({ length: count }, (_, idx) => {
    const s = seed(tenantId, idx + 1);
    const offsetMin = (s % 1440) + idx * 73;
    const created = new Date(Date.now() - offsetMin * 60_000);
    const totalSom = 35_000 + (s % 280_000);
    const statusIdx = s % ORDER_STATUSES.length;
    return {
      id: `${tenantId}-o-${idx + 1}`,
      order_no: `#${(s % 10_000).toString().padStart(4, '0')}`,
      status: ORDER_STATUSES[statusIdx] ?? 'paid',
      total_minor: totalSom * 100,
      created_at: created.toISOString(),
    };
  });
}

export function buildMockAuditEvents(tenantId: string, count = 6): MockAuditEvent[] {
  const actors = ['Demo Super Admin', 'akbar@osh.uz', 'system', 'support@mypos.uz'];
  return Array.from({ length: count }, (_, idx) => {
    const s = seed(tenantId, (idx + 1) * 7);
    const type = AUDIT_TYPES[s % AUDIT_TYPES.length] ?? 'login';
    const actor = actors[s % actors.length] ?? 'system';
    const offsetMin = idx * 95 + (s % 600);
    const created = new Date(Date.now() - offsetMin * 60_000);
    return {
      id: `${tenantId}-a-${idx + 1}`,
      type,
      actor,
      created_at: created.toISOString(),
    };
  });
}
