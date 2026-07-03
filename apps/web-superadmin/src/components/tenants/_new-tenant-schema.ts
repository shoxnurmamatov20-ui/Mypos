import { z } from 'zod';

/**
 * Form schema + helpers for the "create tenant" page. Extracted so the
 * form view stays under the 400-line limit and the validation rules can
 * be reused if/when the page gains a server-action wrapper.
 */
export const TRIAL_DAYS = ['0', '7', '14', '30'] as const;
export type TrialDays = (typeof TRIAL_DAYS)[number];

// Phase 4: kz added; ky/tg slated for future phases.
export const LOCALES = ['uz', 'ru', 'en', 'kz'] as const;
export type LocaleValue = (typeof LOCALES)[number];

export const NewTenantSchema = z.object({
  name: z.string().min(1, 'validation_name_required'),
  slug: z
    .string()
    .min(1, 'validation_slug_required')
    .regex(/^[a-z0-9-]+$/, 'validation_slug_format'),
  plan: z.enum(['free', 'starter', 'pro', 'business', 'enterprise']),
  trial_days: z.enum(TRIAL_DAYS),
  locale: z.enum(LOCALES),
  currency: z.literal('UZS'),
  owner_name: z.string().min(1, 'validation_owner_name_required'),
  owner_email: z.string().min(1, 'validation_email_required').email('validation_email_format'),
  owner_phone: z
    .string()
    .min(1, 'validation_phone_required')
    .regex(/^\+?\d[\d\s-]{8,}$/, 'validation_phone_format'),
  owner_password: z.string().min(8, 'validation_password_min'),
});

export type NewTenantValues = z.infer<typeof NewTenantSchema>;

/** Returns 0–4: weak → very strong. */
export function passwordStrength(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, score);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
