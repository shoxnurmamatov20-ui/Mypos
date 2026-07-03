'use client';

/**
 * Local (per-browser) finance store for the manager panel.
 *
 * The backend has no tenant-level finance endpoints (income/expense categories
 * or a manual operations ledger), so these are persisted to localStorage.
 * Real payment-gateway income is read separately via `paymentsApi` and merged
 * into the operations view at render time. When backend finance endpoints land,
 * swap the persist layer for API calls — the shapes below map 1:1.
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FinanceKind = 'income' | 'expense';

export interface FinanceCategory {
  id: string;
  name: string;
  kind: FinanceKind;
  color: string;
  isActive: boolean;
}

export interface FinanceOperation {
  id: string;
  date: string; // ISO yyyy-mm-dd
  kind: FinanceKind;
  categoryId: string;
  amount: number; // UZS, major units (so'm)
  note: string;
}

const DEFAULT_CATEGORIES: readonly FinanceCategory[] = [
  { id: 'inc-sales', name: 'Savdo', kind: 'income', color: '#10b981', isActive: true },
  { id: 'inc-delivery', name: 'Yetkazib berish', kind: 'income', color: '#0ea5e9', isActive: true },
  { id: 'inc-other', name: 'Boshqa kirimlar', kind: 'income', color: '#8b5cf6', isActive: true },
  { id: 'exp-salary', name: 'Maosh', kind: 'expense', color: '#f59e0b', isActive: true },
  { id: 'exp-utility', name: 'Kommunal', kind: 'expense', color: '#06b6d4', isActive: true },
  { id: 'exp-material', name: 'Xom ashyo', kind: 'expense', color: '#ef4444', isActive: true },
  { id: 'exp-rent', name: 'Ijara', kind: 'expense', color: '#ec4899', isActive: true },
  { id: 'exp-marketing', name: 'Marketing', kind: 'expense', color: '#6366f1', isActive: true },
  { id: 'exp-other', name: 'Boshqa chiqimlar', kind: 'expense', color: '#64748b', isActive: true },
];

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}`;
}

export interface FinanceState {
  categories: FinanceCategory[];
  operations: FinanceOperation[];
  addCategory: (input: Omit<FinanceCategory, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<Omit<FinanceCategory, 'id' | 'kind'>>) => void;
  deleteCategory: (id: string) => void;
  addOperation: (input: Omit<FinanceOperation, 'id'>) => void;
  deleteOperation: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      categories: [...DEFAULT_CATEGORIES],
      operations: [],
      addCategory: (input) =>
        set((s) => ({ categories: [...s.categories, { ...input, id: uid() }] })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          operations: s.operations.filter((o) => o.categoryId !== id),
        })),
      addOperation: (input) =>
        set((s) => ({ operations: [{ ...input, id: uid() }, ...s.operations] })),
      deleteOperation: (id) =>
        set((s) => ({ operations: s.operations.filter((o) => o.id !== id) })),
    }),
    { name: 'mypos_dashboard_finance' },
  ),
);

/** Categories of one kind (income/expense). */
export function categoriesByKind(
  categories: FinanceCategory[],
  kind: FinanceKind,
): FinanceCategory[] {
  return categories.filter((c) => c.kind === kind);
}

/** SSR/CSR hydration guard (localStorage is client-only). */
export function useFinanceHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
