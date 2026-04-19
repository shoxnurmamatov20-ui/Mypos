import { z } from 'zod';
import { EmailSchema, PasswordSchema, UzbekPhoneSchema, LocaleSchema } from './common';

export const LoginSchema = z.object({
  identifier: z.string().min(3), // username, email, or phone
  password: z.string().min(1),
  remember: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterOwnerSchema = z.object({
  restaurantPin: z
    .string()
    .regex(/^\d{8}$/, 'Restoran PIN kodi 8 raqam bo\'lishi kerak'),
  fullName: z.string().min(2).max(128),
  email: EmailSchema,
  phone: UzbekPhoneSchema,
  password: PasswordSchema,
  locale: LocaleSchema.optional().default('uz'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Shartlarni qabul qilishingiz kerak' }) }),
});
export type RegisterOwnerInput = z.infer<typeof RegisterOwnerSchema>;

export const ForgotPasswordSchema = z.object({
  identifier: z.string().min(3), // email or phone
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: PasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Parollar mos kelmadi',
    path: ['passwordConfirmation'],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const MfaVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, '6 raqamli kod kiriting'),
});
