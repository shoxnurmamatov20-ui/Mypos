'use client';

import { create } from 'zustand';
import type { MenuItem, OrderType } from '@/lib/api';
import type { LocalizedName } from '@/lib/format';

export type CartLine = {
  id: string;
  name: LocalizedName;
  price: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  /** Flat so'm discount applied to the whole ticket. */
  discount: number;
  orderType: OrderType;
};

type CartActions = {
  add: (item: MenuItem) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  setDiscount: (value: number) => void;
  setOrderType: (type: OrderType) => void;
  clear: () => void;
};

/** Per-line subtotal. */
export function lineSubtotal(line: CartLine): number {
  return line.price * line.qty;
}

/** Sum of every line before discount. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineSubtotal(line), 0);
}

/**
 * Final amount the cashier charges. Menu prices are VAT-inclusive (UZ QQS),
 * so no tax is added on top — this mirrors the backend's
 * `total = subtotal - discount` exactly (CreateOrderAction).
 */
export function cartTotal(lines: CartLine[], discount: number): number {
  return Math.max(0, cartSubtotal(lines) - discount);
}

export const useCartStore = create<CartState & CartActions>((set) => ({
  lines: [],
  discount: 0,
  orderType: 'dine_in',

  add: (item) =>
    set((state) => {
      const existing = state.lines.find((line) => line.id === item.id);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.id === item.id ? { ...line, qty: line.qty + 1 } : line,
          ),
        };
      }
      return {
        lines: [...state.lines, { id: item.id, name: item.name, price: item.price, qty: 1 }],
      };
    }),

  increment: (id) =>
    set((state) => ({
      lines: state.lines.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line)),
    })),

  decrement: (id) =>
    set((state) => ({
      lines: state.lines
        .map((line) => (line.id === id ? { ...line, qty: line.qty - 1 } : line))
        .filter((line) => line.qty > 0),
    })),

  remove: (id) => set((state) => ({ lines: state.lines.filter((line) => line.id !== id) })),

  setDiscount: (value) => set({ discount: Math.max(0, Math.round(value || 0)) }),

  setOrderType: (type) => set({ orderType: type }),

  clear: () => set({ lines: [], discount: 0, orderType: 'dine_in' }),
}));
