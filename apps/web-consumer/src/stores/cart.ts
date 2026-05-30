'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  /** Stable mock menu item id (per restaurant). */
  id: string;
  restaurantSlug: string;
  /** Already-localized display name. */
  name: string;
  priceMinor: number;
  quantity: number;
  notes?: string;
  emoji: string;
  /** Tailwind literal class, e.g. `bg-red-100`. */
  bgColor: string;
};

type CartState = {
  restaurantSlug: string | null;
  restaurantName: string | null;
  items: CartItem[];
};

type CartActions = {
  addItem: (item: CartItem, restaurantName: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  setItemNotes: (itemId: string, notes: string) => void;
  clear: () => void;
  resetForNewRestaurant: (slug: string, name: string) => void;
};

const initial: CartState = {
  restaurantSlug: null,
  restaurantName: null,
  items: [],
};

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set) => ({
      ...initial,

      addItem: (item, restaurantName) =>
        set((state) => {
          // Different restaurant → replace cart entirely (Wolt / Glovo behaviour).
          if (state.restaurantSlug && state.restaurantSlug !== item.restaurantSlug) {
            return {
              restaurantSlug: item.restaurantSlug,
              restaurantName,
              items: [item],
            };
          }

          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              ...state,
              restaurantSlug: item.restaurantSlug,
              restaurantName,
              items: state.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      notes: item.notes ?? i.notes,
                    }
                  : i,
              ),
            };
          }

          return {
            ...state,
            restaurantSlug: item.restaurantSlug,
            restaurantName,
            items: [...state.items, item],
          };
        }),

      incrementItem: (itemId) =>
        set((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)),
        })),

      decrementItem: (itemId) =>
        set((s) => {
          const target = s.items.find((i) => i.id === itemId);
          if (!target) return s;
          if (target.quantity <= 1) {
            return { ...s, items: s.items.filter((i) => i.id !== itemId) };
          }
          return {
            ...s,
            items: s.items.map((i) =>
              i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i,
            ),
          };
        }),

      removeItem: (itemId) =>
        set((s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) })),

      setItemNotes: (itemId, notes) =>
        set((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === itemId ? { ...i, notes } : i)),
        })),

      clear: () => set(initial),

      resetForNewRestaurant: (slug, name) =>
        set({ restaurantSlug: slug, restaurantName: name, items: [] }),
    }),
    {
      name: 'mypos_consumer_cart',
      storage: createJSONStorage(() => localStorage),
      // Only persist the relevant slice of state.
      partialize: (state) => ({
        restaurantSlug: state.restaurantSlug,
        restaurantName: state.restaurantName,
        items: state.items,
      }),
    },
  ),
);

// ------------ Selectors ------------

export const selectCartCount = (s: CartState): number =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s: CartState): number =>
  s.items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0);

/** Quantity of a single item id in the cart (0 if not present). */
export const selectItemQuantity =
  (itemId: string) =>
  (s: CartState): number =>
    s.items.find((i) => i.id === itemId)?.quantity ?? 0;
