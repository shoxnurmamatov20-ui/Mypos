import { create } from 'zustand';
import type { MenuItem } from '@mypos/api-client';

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number; // minor units (UZS so'm, no fractional)
  quantity: number;
  notes?: string;
};

type CartState = {
  tableId: string | null;
  customerId: string | null;
  items: CartItem[];
  notes: string;
};

type CartActions = {
  selectTable: (tableId: string | null) => void;
  setCustomer: (customerId: string | null) => void;
  addItem: (menuItem: MenuItem, locale?: 'uz' | 'ru' | 'en') => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  incrementItem: (menuItemId: string) => void;
  decrementItem: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  setItemNotes: (menuItemId: string, notes: string) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
};

const initialState: CartState = {
  tableId: null,
  customerId: null,
  items: [],
  notes: '',
};

export const useCartStore = create<CartState & CartActions>((set) => ({
  ...initialState,

  selectTable: (tableId) => set({ tableId }),

  setCustomer: (customerId) => set({ customerId }),

  addItem: (menuItem, locale = 'uz') => {
    const id = menuItem.id;
    const name = menuItem.name[locale] ?? menuItem.name.uz;
    const price = menuItem.price.effective_amount;
    set((state) => {
      const existing = state.items.find((item) => item.menuItemId === id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.menuItemId === id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { menuItemId: id, name, price, quantity: 1 },
        ],
      };
    });
  },

  updateQuantity: (menuItemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.menuItemId !== menuItemId),
        };
      }
      return {
        items: state.items.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item,
        ),
      };
    });
  },

  incrementItem: (menuItemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    })),

  decrementItem: (menuItemId) =>
    set((state) => {
      const target = state.items.find((i) => i.menuItemId === menuItemId);
      if (!target) return state;
      if (target.quantity <= 1) {
        return {
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        };
      }
      return {
        items: state.items.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      };
    }),

  removeItem: (menuItemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.menuItemId !== menuItemId),
    })),

  setItemNotes: (menuItemId, notes) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.menuItemId === menuItemId ? { ...item, notes } : item,
      ),
    })),

  setNotes: (notes) => set({ notes }),

  clear: () => set({ ...initialState }),
}));

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
