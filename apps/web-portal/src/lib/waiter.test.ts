import { describe, expect, it } from 'vitest';
import { resolvePostLoginTarget } from './post-login';
import {
  formatNum,
  formatSom,
  formatSomShort,
  formatUzs,
  getWaiterData,
  WAITER_ZONES,
} from './waiter-data';

/**
 * Core waiter-panel logic. Pure functions only — no DOM, no new test deps.
 * The `resolvePostLoginTarget` block is the regression guard for the bug
 * this panel fixes: a waiter login must open the waiter panel, not the
 * generic dashboard handoff.
 */

describe('resolvePostLoginTarget', () => {
  it('routes a waiter to the in-app waiter panel', () => {
    // The '/panel/portal' basePath is intentional: the target is used in a
    // raw `window.location.href` navigation, which does NOT auto-prepend
    // Next's basePath (see resolvePostLoginTarget's comment).
    expect(resolvePostLoginTarget('waiter', 'uz')).toEqual({
      kind: 'internal',
      path: '/panel/portal/uz/tables',
    });
  });

  it('keeps the requested locale in the waiter path', () => {
    expect(resolvePostLoginTarget('waiter', 'ru')).toEqual({
      kind: 'internal',
      path: '/panel/portal/ru/tables',
    });
  });

  it.each([
    'manager',
    'owner',
    'cashier',
    'chef',
    'courier',
    'ceo',
    'super_admin',
  ])('hands the "%s" role off to the dispatch flow', (role) => {
    expect(resolvePostLoginTarget(role, 'uz')).toEqual({ kind: 'dispatch' });
  });
});

describe('formatSom', () => {
  it('groups thousands and appends a currency suffix', () => {
    const out = formatSom(184_000);
    expect(out).toMatch(/184/);
    expect(out.trim().length).toBeGreaterThan(7);
  });
});

describe('formatSomShort', () => {
  it('abbreviates millions and thousands', () => {
    expect(formatSomShort(4_860_000)).toMatch(/^4\.9M /);
    expect(formatSomShort(412_000)).toMatch(/^412K /);
    expect(formatSomShort(900)).toMatch(/^900 /);
  });
});

describe('getWaiterData integrity', () => {
  const data = getWaiterData();

  it('every order total equals the sum of its line items', () => {
    for (const order of data.orders) {
      const sum = order.items.reduce((acc, item) => acc + item.price * item.qty, 0);
      expect(order.total).toBe(sum);
    }
  });

  it('every occupied table total matches its linked order', () => {
    const orderById = new Map(data.orders.map((order) => [order.id, order]));
    for (const table of data.tables) {
      if (!table.orderId) continue;
      const order = orderById.get(table.orderId);
      expect(order, `table ${table.label} references missing ${table.orderId}`).toBeDefined();
      expect(table.total).toBe(order?.total);
    }
  });

  it('exposes data for all four waiter sections', () => {
    expect(data.tables.length).toBeGreaterThan(0);
    expect(data.orders.length).toBeGreaterThan(0);
    expect(data.menu.length).toBeGreaterThan(0);
    expect(data.shift.activity.length).toBeGreaterThan(0);
  });

  it('populates every declared zone with tables', () => {
    for (const zone of WAITER_ZONES) {
      expect(data.tables.some((table) => table.zone === zone)).toBe(true);
    }
  });

  it('gives every occupied table an occupant name and open time', () => {
    const occupied = data.tables.filter(
      (table) => table.status === 'seated' || table.status === 'bill',
    );
    expect(occupied.length).toBeGreaterThan(0);
    for (const table of occupied) {
      expect(table.occupantName, `${table.label} missing occupant`).toBeTruthy();
      expect(table.openedAt, `${table.label} missing openedAt`).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('has at least one of the waiter’s own open bills for the home screen', () => {
    const mine = data.tables.filter((table) => table.mine && table.total);
    expect(mine.length).toBeGreaterThan(0);
  });
});

describe('so‘m formatters', () => {
  it('formatNum groups thousands without a unit', () => {
    expect(formatNum(1_033_760)).toMatch(/^1\D?033\D?760$/);
  });

  it('formatUzs appends the "uzs" unit', () => {
    expect(formatUzs(45_000)).toMatch(/^45\D?000 uzs$/);
  });
});
