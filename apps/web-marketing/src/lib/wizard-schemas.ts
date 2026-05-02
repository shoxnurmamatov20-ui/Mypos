/**
 * Zod schemas + types for the 5-step onboarding wizard.
 *
 * These are also the shape we POST to `/api/v1/public/onboarding/*` —
 * the backend re-validates every field with a `FormRequest` (defense in
 * depth: never trust the client) but using Zod here keeps the shapes in
 * sync at the type level.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants — these mirror Laravel enums on the API side. Keep them
// hand-synced or move to `@mypos/types` if the list grows.
// ---------------------------------------------------------------------------

export const CUISINE_TYPES = [
  'pizza',
  'lavash',
  'choyxona',
  'fastfood',
  'sushi',
  'cafe',
  'bakery',
  'bar',
  'fine_dining',
  'other',
] as const;
export type CuisineType = (typeof CUISINE_TYPES)[number];

export const MENU_MODES = ['ai', 'csv', 'manual'] as const;
export type MenuMode = (typeof MENU_MODES)[number];

export const PAYMENT_PROVIDERS = ['cash', 'click', 'payme', 'card'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const TIER_KEYS = ['free', 'pro', 'plus', 'enterprise'] as const;
export type TierKey = (typeof TIER_KEYS)[number];

// ---------------------------------------------------------------------------
// Per-step schemas — used by the step components for inline validation.
// ---------------------------------------------------------------------------

// Slug rules mirror what the backend enforces in TenantSlugRule:
// 3-32 chars, lowercase alphanumeric + hyphen, no leading/trailing hyphen.
const slugRegex = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

// Loose phone regex — international format, 7-15 digits with optional +/space/dash.
const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export const step1Schema = z.object({
  name: z.string().trim().min(2, 'restaurant_name_too_short').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'slug_too_short')
    .max(32, 'slug_too_long')
    .regex(slugRegex, 'slug_invalid_chars'),
  cuisine: z.enum(CUISINE_TYPES),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4).max(255),
  phone: z.string().trim().regex(phoneRegex, 'phone_invalid'),
  email: z.string().trim().email('email_invalid'),
  logoDataUrl: z.string().nullable(),
});
export type Step1Data = z.infer<typeof step1Schema>;

export const menuItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
  category: z.string().min(1).max(80),
  // Price stored as integer "tiyin" (1 UZS = 100 tiyin). Frontend collects
  // it as decimal sum and the action layer converts before sending.
  priceUzs: z.number().int().nonnegative(),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const step2Schema = z.object({
  mode: z.enum(MENU_MODES),
  items: z.array(menuItemSchema).max(500),
});
export type Step2Data = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
  zones: z.number().int().min(1).max(20),
  tablesPerZone: z.number().int().min(1).max(50),
});
export type Step3Data = z.infer<typeof step3Schema>;

export const step4Schema = z.object({
  providers: z.array(z.enum(PAYMENT_PROVIDERS)).min(1, 'select_at_least_one'),
});
export type Step4Data = z.infer<typeof step4Schema>;

export const step5Schema = z.object({
  tier: z.enum(TIER_KEYS),
});
export type Step5Data = z.infer<typeof step5Schema>;

// ---------------------------------------------------------------------------
// Aggregate state — what the Zustand store holds.
// ---------------------------------------------------------------------------

export type WizardState = {
  step: 1 | 2 | 3 | 4 | 5;
  restaurant: Step1Data;
  menu: Step2Data;
  tables: Step3Data;
  payments: Step4Data;
  tier: TierKey;
  submission: {
    submitting: boolean;
    error: string | null;
    registrationId: string | null;
  };
};

// Final POST payload — flatten + transforms the store state into what the
// backend `OnboardingController@submit` expects.
export const finalSubmissionSchema = z.object({
  restaurant: step1Schema,
  menu: step2Schema,
  tables: step3Schema,
  payments: step4Schema,
  tier: z.enum(TIER_KEYS),
  // Optional registration id from a partial submit (resume support).
  registration_id: z.string().uuid().optional(),
});
export type FinalSubmission = z.infer<typeof finalSubmissionSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Auto-derive a URL-safe slug from a restaurant name.
 * Matches the backend's slugifier so name → suggested slug is consistent
 * across signup screens.
 */
export function slugifyRestaurantName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .normalize('NFKD')
      // Strip diacritics
      .replace(/\p{Diacritic}/gu, '')
      // Latinise common Uzbek/Russian transliterations conservatively.
      // We don't try to be perfect — the user can override.
      .replace(/[ʻ'`ʼ]/g, '')
      .replace(/ʼ/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32)
  );
}
