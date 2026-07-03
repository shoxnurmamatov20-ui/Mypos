import { z } from 'zod';

export const LocaleSchema = z.enum(['uz', 'ru', 'en']);
export type LocaleInput = z.infer<typeof LocaleSchema>;

export const CurrencySchema = z.enum(['UZS', 'USD', 'EUR', 'RUB', 'KZT', 'TRY']);
export type CurrencyInput = z.infer<typeof CurrencySchema>;

export const UUIDSchema = z.string().uuid();

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
});

/** UZ phone: +998 XX XXX XX XX or simplified */
export const UzbekPhoneSchema = z.string().regex(/^\+?998\d{9}$/, {
  message: "Telefon raqami noto'g'ri formatda (+998XXXXXXXXX)",
});

/** International phone — E.164 */
export const PhoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, {
  message: 'Invalid phone number',
});

export const EmailSchema = z.string().email();

export const PasswordSchema = z
  .string()
  .min(8, "Parol kamida 8 belgi bo'lishi kerak")
  .max(128)
  .regex(/[A-Z]/, "Parolda katta harf bo'lishi kerak")
  .regex(/[a-z]/, "Parolda kichik harf bo'lishi kerak")
  .regex(/[0-9]/, "Parolda raqam bo'lishi kerak");

/** Short PIN for PoS (4 digits) */
export const PinSchema = z.string().regex(/^\d{4}$/, "PIN 4 raqamdan iborat bo'lishi kerak");

/** Restaurant registration PIN (8 digits) */
export const RestaurantPinSchema = z
  .string()
  .regex(/^\d{8}$/, "PIN kod 8 raqamdan iborat bo'lishi kerak");

/** i18n translated string — all 3 locales required */
export const TranslatedSchema = z.object({
  uz: z.string().min(1),
  ru: z.string().min(1),
  en: z.string().min(1),
});
export type TranslatedInput = z.infer<typeof TranslatedSchema>;

/** Money — positive integer (store as minor units, e.g., tiyin) */
export const MoneyAmountSchema = z.object({
  amount: z.number().int().min(0),
  currency: CurrencySchema,
});
