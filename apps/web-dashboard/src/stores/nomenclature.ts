'use client';

/**
 * Local (per-browser) nomenclature store for the manager panel.
 *
 * Backend has no endpoints for semi-finished products, semi-finished categories,
 * or sales categories — these are persisted to localStorage. Dishes (menu items),
 * raw materials (ingredients) and their categories already have real backend
 * pages (menuApi / inventoryApi) and are only LINKED into the Nomenklatura
 * sidebar section. When backend endpoints land, swap the persist layer.
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NomCatKind = 'semi' | 'sales';

export interface NomCategory {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface SemiProduct {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  outputQty: number;
  note: string;
  isActive: boolean;
}

const DEFAULT_SEMI_CATEGORIES: readonly NomCategory[] = [
  { id: 'semi-sauce', name: 'Souslar', color: '#f59e0b', isActive: true },
  { id: 'semi-dough', name: 'Xamir', color: '#0ea5e9', isActive: true },
  { id: 'semi-broth', name: 'Bulyonlar', color: '#ef4444', isActive: true },
  { id: 'semi-marinade', name: 'Marinadlar', color: '#8b5cf6', isActive: true },
];

const DEFAULT_SALES_CATEGORIES: readonly NomCategory[] = [
  { id: 'sales-dinein', name: 'Ichki (zal)', color: '#10b981', isActive: true },
  { id: 'sales-delivery', name: 'Yetkazib berish', color: '#0ea5e9', isActive: true },
  { id: 'sales-takeaway', name: 'Olib ketish', color: '#f59e0b', isActive: true },
];

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}`;
}

export interface NomState {
  semiCategories: NomCategory[];
  salesCategories: NomCategory[];
  semiProducts: SemiProduct[];
  addCategory: (kind: NomCatKind, input: Omit<NomCategory, 'id'>) => void;
  updateCategory: (kind: NomCatKind, id: string, patch: Partial<Omit<NomCategory, 'id'>>) => void;
  deleteCategory: (kind: NomCatKind, id: string) => void;
  addSemiProduct: (input: Omit<SemiProduct, 'id'>) => void;
  updateSemiProduct: (id: string, patch: Partial<Omit<SemiProduct, 'id'>>) => void;
  deleteSemiProduct: (id: string) => void;
}

export const useNomenclatureStore = create<NomState>()(
  persist(
    (set) => ({
      semiCategories: [...DEFAULT_SEMI_CATEGORIES],
      salesCategories: [...DEFAULT_SALES_CATEGORIES],
      semiProducts: [],
      addCategory: (kind, input) =>
        set((s) =>
          kind === 'semi'
            ? { semiCategories: [...s.semiCategories, { ...input, id: uid() }] }
            : { salesCategories: [...s.salesCategories, { ...input, id: uid() }] },
        ),
      updateCategory: (kind, id, patch) =>
        set((s) =>
          kind === 'semi'
            ? { semiCategories: s.semiCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }
            : { salesCategories: s.salesCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
        ),
      deleteCategory: (kind, id) =>
        set((s) =>
          kind === 'semi'
            ? {
                semiCategories: s.semiCategories.filter((c) => c.id !== id),
                semiProducts: s.semiProducts.filter((p) => p.categoryId !== id),
              }
            : { salesCategories: s.salesCategories.filter((c) => c.id !== id) },
        ),
      addSemiProduct: (input) =>
        set((s) => ({ semiProducts: [{ ...input, id: uid() }, ...s.semiProducts] })),
      updateSemiProduct: (id, patch) =>
        set((s) => ({
          semiProducts: s.semiProducts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteSemiProduct: (id) =>
        set((s) => ({ semiProducts: s.semiProducts.filter((p) => p.id !== id) })),
    }),
    { name: 'mypos_dashboard_nomenclature' },
  ),
);

/** SSR/CSR hydration guard (localStorage is client-only). */
export function useNomHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
