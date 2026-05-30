'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Kitchen display preferences — every cook tablet keeps its own copy in
 * localStorage (`mypos_kitchen_settings`). These are *device* settings,
 * not account settings: a loud chime on the hot line, a quiet one at
 * the pass. Nothing here touches the backend.
 */

export type CardDensity = 'comfortable' | 'compact';

export type KitchenSettings = {
  /** Play a chime when a new ticket lands on the board. */
  soundEnabled: boolean;
  /** Chime volume, 0–1. */
  soundVolume: number;
  /** Vibrate the device on a new ticket (mobile / tablet only). */
  vibrationEnabled: boolean;
  /** Minutes after which a ticket turns amber. */
  warningThresholdMin: number;
  /** Minutes after which a ticket turns red and pulses. */
  urgentThresholdMin: number;
  /** Order-card spacing on the board. */
  cardDensity: CardDensity;
};

type KitchenSettingsStore = KitchenSettings & {
  set: <K extends keyof KitchenSettings>(key: K, value: KitchenSettings[K]) => void;
  reset: () => void;
};

export const DEFAULT_SETTINGS: KitchenSettings = {
  soundEnabled: true,
  soundVolume: 0.7,
  vibrationEnabled: true,
  warningThresholdMin: 5,
  urgentThresholdMin: 15,
  cardDensity: 'comfortable',
};

export const useKitchenSettings = create<KitchenSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<KitchenSettings>),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'mypos_kitchen_settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
