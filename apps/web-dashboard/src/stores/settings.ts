'use client';

/**
 * Local (per-browser) settings store for the manager panel.
 *
 * The backend currently exposes no tenant-level settings endpoints for
 * place / payment-methods / printer / receipt configuration, so these are
 * persisted to localStorage. When backend endpoints land, swap the persist
 * layer for API calls — the shape below maps 1:1 to the intended payloads.
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type DayHours = { open: string; close: string; closed: boolean };

export interface PlaceSettings {
  name: string;
  address: string;
  phone: string;
  city: string;
  timezone: string;
  hours: Record<Weekday, DayHours>;
}

export type PaymentMethodKey = 'cash' | 'card' | 'payme' | 'click' | 'online';
export const PAYMENT_METHODS: readonly PaymentMethodKey[] = [
  'cash',
  'card',
  'payme',
  'click',
  'online',
];

export interface PaymentSettings {
  enabled: Record<PaymentMethodKey, boolean>;
  defaultMethod: PaymentMethodKey;
}

export type PrinterConnection = 'usb' | 'network' | 'bluetooth';
export type PaperWidth = '58' | '80';

export interface PrinterSettings {
  name: string;
  connection: PrinterConnection;
  ip: string;
  port: string;
  paperWidth: PaperWidth;
  autoPrint: boolean;
  copies: number;
}

export type ReceiptFontSize = 'small' | 'normal' | 'large';

export interface ReceiptSettings {
  showLogo: boolean;
  logoUrl: string;
  header: string;
  footer: string;
  fontSize: ReceiptFontSize;
  showTax: boolean;
  showQr: boolean;
  paperWidth: PaperWidth;
  language: 'uz' | 'ru' | 'en';
}

export interface ProfilePrefs {
  displayName: string;
  avatarUrl: string;
  phone: string;
}

const defaultHours = (): Record<Weekday, DayHours> =>
  WEEKDAYS.reduce(
    (acc, d) => {
      acc[d] = { open: '09:00', close: '23:00', closed: false };
      return acc;
    },
    {} as Record<Weekday, DayHours>,
  );

export const DEFAULT_PLACE: PlaceSettings = {
  name: '',
  address: '',
  phone: '',
  city: '',
  timezone: 'Asia/Tashkent',
  hours: defaultHours(),
};

export const DEFAULT_PAYMENT: PaymentSettings = {
  enabled: { cash: true, card: true, payme: false, click: false, online: false },
  defaultMethod: 'cash',
};

export const DEFAULT_PRINTER: PrinterSettings = {
  name: '',
  connection: 'usb',
  ip: '',
  port: '9100',
  paperWidth: '80',
  autoPrint: true,
  copies: 1,
};

export const DEFAULT_RECEIPT: ReceiptSettings = {
  showLogo: true,
  logoUrl: '',
  header: '',
  footer: 'Tashrifingiz uchun rahmat!',
  fontSize: 'normal',
  showTax: true,
  showQr: false,
  paperWidth: '80',
  language: 'uz',
};

export const DEFAULT_PROFILE: ProfilePrefs = {
  displayName: '',
  avatarUrl: '',
  phone: '',
};

export interface SettingsState {
  place: PlaceSettings;
  payment: PaymentSettings;
  printer: PrinterSettings;
  receipt: ReceiptSettings;
  profile: ProfilePrefs;
  setPlace: (patch: Partial<PlaceSettings>) => void;
  setDayHours: (day: Weekday, patch: Partial<DayHours>) => void;
  setPayment: (patch: Partial<PaymentSettings>) => void;
  togglePaymentMethod: (key: PaymentMethodKey, value: boolean) => void;
  setPrinter: (patch: Partial<PrinterSettings>) => void;
  setReceipt: (patch: Partial<ReceiptSettings>) => void;
  setProfile: (patch: Partial<ProfilePrefs>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      place: DEFAULT_PLACE,
      payment: DEFAULT_PAYMENT,
      printer: DEFAULT_PRINTER,
      receipt: DEFAULT_RECEIPT,
      profile: DEFAULT_PROFILE,
      setPlace: (patch) => set((s) => ({ place: { ...s.place, ...patch } })),
      setDayHours: (day, patch) =>
        set((s) => ({
          place: {
            ...s.place,
            hours: { ...s.place.hours, [day]: { ...s.place.hours[day], ...patch } },
          },
        })),
      setPayment: (patch) => set((s) => ({ payment: { ...s.payment, ...patch } })),
      togglePaymentMethod: (key, value) =>
        set((s) => ({
          payment: { ...s.payment, enabled: { ...s.payment.enabled, [key]: value } },
        })),
      setPrinter: (patch) => set((s) => ({ printer: { ...s.printer, ...patch } })),
      setReceipt: (patch) => set((s) => ({ receipt: { ...s.receipt, ...patch } })),
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    { name: 'mypos_dashboard_settings' },
  ),
);

/**
 * Guard against SSR/CSR hydration mismatch: localStorage is only available
 * client-side, so settings pages should render a skeleton until mounted.
 */
export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
