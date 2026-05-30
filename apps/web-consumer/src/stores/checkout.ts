'use client';

/**
 * Checkout store (Phase 5).
 *
 * Holds the per-session checkout selection: delivery address, payment
 * method, and free-form order notes. The address book is mocked for now —
 * Phase 6 will replace it with `addressesApi.list()` and persisted CRUD.
 *
 * The store is intentionally separate from the cart so that placing an
 * order or switching restaurants doesn't reset the customer's preferences.
 * State is persisted to localStorage so users keep their default address
 * across visits.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DeliveryAddress = {
  id: string;
  /** User-facing label, e.g. "Uy", "Ish". */
  label: string;
  street: string;
  city: string;
  apartment?: string;
  notes?: string;
  /** Single-character emoji rendered in address chips. */
  emoji: string;
};

export type PaymentMethod = 'cash' | 'click' | 'payme' | 'card';

type CheckoutState = {
  selectedAddressId: string;
  addresses: DeliveryAddress[];
  paymentMethod: PaymentMethod;
  orderNotes: string;
};

type CheckoutActions = {
  selectAddress: (id: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setOrderNotes: (notes: string) => void;
  addAddress: (address: DeliveryAddress) => void;
};

const DEFAULT_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'home',
    label: 'Uy',
    street: "Amir Temur ko'chasi 12",
    city: 'Toshkent, Yunusobod tumani',
    apartment: '5-uy, 24-xonadon',
    emoji: '🏠',
  },
  {
    id: 'work',
    label: 'Ish',
    street: "Mustaqillik shoh ko'chasi 78",
    city: 'Toshkent, Mirobod tumani',
    apartment: 'IT Park, B blok',
    emoji: '🏢',
  },
];

const initial: CheckoutState = {
  selectedAddressId: 'home',
  addresses: DEFAULT_ADDRESSES,
  paymentMethod: 'cash',
  orderNotes: '',
};

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set) => ({
      ...initial,

      selectAddress: (selectedAddressId) => set({ selectedAddressId }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      setOrderNotes: (orderNotes) => set({ orderNotes }),

      addAddress: (address) =>
        set((s) => ({
          addresses: [...s.addresses, address],
          selectedAddressId: address.id,
        })),
    }),
    {
      name: 'mypos_consumer_checkout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedAddressId: state.selectedAddressId,
        addresses: state.addresses,
        paymentMethod: state.paymentMethod,
        // Notes are intentionally NOT persisted — they're per-order.
      }),
    },
  ),
);

// ------------ Selectors ------------

export const selectActiveAddress = (s: CheckoutState): DeliveryAddress | undefined =>
  s.addresses.find((a) => a.id === s.selectedAddressId);
