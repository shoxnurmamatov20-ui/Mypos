/**
 * Zustand store for the 5-step self-service onboarding wizard.
 *
 * State is persisted to sessionStorage so a page reload mid-flow does not
 * wipe what the user has typed. We deliberately do NOT persist to
 * localStorage — onboarding includes contact details, and this is a public
 * device with no auth boundary.
 *
 * Only client components read this store; server components compose the
 * shell. Each step component is responsible for its own validation (Zod
 * schemas in `wizard-schemas.ts`) and for advancing the cursor.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CuisineType,
  MenuMode,
  PaymentProvider,
  TierKey,
  WizardState,
} from './wizard-schemas';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 5;

type WizardActions = {
  // Navigation
  setStep: (step: WizardStep) => void;
  next: () => void;
  prev: () => void;
  // Step 1
  setRestaurant: (data: Partial<WizardState['restaurant']>) => void;
  // Step 2
  setMenuMode: (mode: MenuMode) => void;
  setMenuItems: (items: WizardState['menu']['items']) => void;
  // Step 3
  setTables: (data: Partial<WizardState['tables']>) => void;
  // Step 4
  togglePaymentProvider: (provider: PaymentProvider) => void;
  // Step 5
  setTier: (tier: TierKey) => void;
  // Submission
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  setRegistrationId: (id: string | null) => void;
  reset: () => void;
};

const INITIAL_STATE: WizardState = {
  step: 1,
  restaurant: {
    name: '',
    slug: '',
    cuisine: 'fastfood' as CuisineType,
    city: '',
    address: '',
    phone: '',
    email: '',
    logoDataUrl: null,
  },
  menu: {
    mode: 'manual',
    items: [],
  },
  tables: {
    zones: 1,
    tablesPerZone: 8,
  },
  payments: {
    providers: ['cash'],
  },
  tier: 'free',
  submission: {
    submitting: false,
    error: null,
    registrationId: null,
  },
};

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setStep: (step) => set({ step }),
      next: () =>
        set((s) => ({
          step: Math.min(s.step + 1, TOTAL_STEPS) as WizardStep,
        })),
      prev: () =>
        set((s) => ({
          step: Math.max(s.step - 1, 1) as WizardStep,
        })),
      setRestaurant: (data) => set((s) => ({ restaurant: { ...s.restaurant, ...data } })),
      setMenuMode: (mode) => set((s) => ({ menu: { ...s.menu, mode } })),
      setMenuItems: (items) => set((s) => ({ menu: { ...s.menu, items } })),
      setTables: (data) => set((s) => ({ tables: { ...s.tables, ...data } })),
      togglePaymentProvider: (provider) =>
        set((s) => {
          const has = s.payments.providers.includes(provider);
          const next = has
            ? s.payments.providers.filter((p) => p !== provider)
            : [...s.payments.providers, provider];
          // Always keep at least cash
          return {
            payments: {
              providers: next.length > 0 ? next : (['cash'] as PaymentProvider[]),
            },
          };
        }),
      setTier: (tier) => set({ tier }),
      setSubmitting: (submitting) => set((s) => ({ submission: { ...s.submission, submitting } })),
      setError: (error) => set((s) => ({ submission: { ...s.submission, error } })),
      setRegistrationId: (registrationId) =>
        set((s) => ({ submission: { ...s.submission, registrationId } })),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'mypos-onboarding-v1',
      // Read sessionStorage off `globalThis` so this module is import-safe
      // during SSR (Next 15 evaluates client modules during the server
      // pre-render). The lazy resolver inside `createJSONStorage` is only
      // called when the persist middleware actually needs to read/write.
      storage: createJSONStorage(() => globalThis.sessionStorage),
      // Don't persist transient submission state — a refresh during submit
      // should leave the user able to retry.
      partialize: (s) => ({
        step: s.step,
        restaurant: s.restaurant,
        menu: s.menu,
        tables: s.tables,
        payments: s.payments,
        tier: s.tier,
      }),
    },
  ),
);

export const TOTAL_WIZARD_STEPS = TOTAL_STEPS;
