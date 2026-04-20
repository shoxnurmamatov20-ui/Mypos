import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image_url: string | null;
};

type CartState = {
  /** Current tenant slug — state is isolated per tenant. */
  tenantSlug: string | null;
  items: CartItem[];
  setTenantSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string) => void;
  incrementQty: (id: string) => void;
  decrementQty: (id: string) => void;
  clear: () => void;
  subtotal: () => number;
  totalCount: () => number;
};

const STORAGE_KEY = 'mypos-qr-cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantSlug: null,
      items: [],

      setTenantSlug: (slug) => {
        const { tenantSlug } = get();
        if (tenantSlug !== slug) {
          // Switching tenants clears the cart — no cross-tenant leakage.
          set({ tenantSlug: slug, items: [] });
        }
      },

      addItem: (input) => {
        set((state) => {
          const existing = state.items.find((it) => it.id === input.id);
          if (existing) {
            return {
              items: state.items.map((it) =>
                it.id === input.id ? { ...it, qty: it.qty + 1 } : it,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: input.id,
                name: input.name,
                price: input.price,
                image_url: input.image_url,
                qty: 1,
              },
            ],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((it) => it.id !== id) }));
      },

      incrementQty: (id) => {
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, qty: Math.min(99, it.qty + 1) } : it,
          ),
        }));
      },

      decrementQty: (id) => {
        set((state) => {
          const updated = state.items
            .map((it) => (it.id === id ? { ...it, qty: it.qty - 1 } : it))
            .filter((it) => it.qty > 0);
          return { items: updated };
        });
      },

      clear: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, it) => sum + it.price * it.qty, 0),

      totalCount: () => get().items.reduce((sum, it) => sum + it.qty, 0),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : {
              getItem: (_name: string): string | null => null,
              setItem: (_name: string, _value: string): void => undefined,
              removeItem: (_name: string): void => undefined,
            },
      ),
      partialize: (state) => ({
        tenantSlug: state.tenantSlug,
        items: state.items,
      }),
    },
  ),
);
