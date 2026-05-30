'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@mypos/api-client';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RegistrationUnavailableError, useAuthStore } from '@/stores/auth';
import { PasswordField } from '../_components/password-field';
import { PhoneField } from '../_components/phone-field';
import { SubmitButton } from '../_components/submit-button';
import { TextField } from '../_components/text-field';

const RegisterSchema = z
  .object({
    firstName: z.string().min(2, { message: 'name_too_short' }),
    phone: z.string().regex(/^\d{9}$/, { message: 'phone_invalid' }),
    password: z.string().min(6, { message: 'password_too_short' }),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'passwords_no_match',
    path: ['passwordConfirm'],
  });

type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const localeFromParams = params?.locale ?? locale;
  const registerUser = useAuthStore((s) => s.register);

  const [serverError, setServerError] = useState<string | null>(null);
  const [useMobileFallback, setUseMobileFallback] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { firstName: '', phone: '', password: '', passwordConfirm: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setUseMobileFallback(false);
    try {
      await registerUser({
        firstName: values.firstName,
        phone: `+998${values.phone}`,
        password: values.password,
        locale: (localeFromParams as 'uz' | 'ru' | 'en') ?? 'uz',
      });
      router.push(`/${localeFromParams}` as Route);
    } catch (err) {
      if (err instanceof RegistrationUnavailableError) {
        setUseMobileFallback(true);
        return;
      }
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setServerError(body?.message ?? tErrors('generic'));
      } else {
        setServerError(tErrors('network'));
      }
    }
  });

  const fieldMessage = (key?: string) => (key ? t(key) : undefined);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
          {t('register_title')}
        </h1>
        <p className="text-base text-neutral-500">{t('register_subtitle')}</p>
      </header>

      {useMobileFallback ? (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5"
        >
          <p className="text-sm font-medium leading-relaxed text-brand-900">
            {t('register_failed_use_mobile')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="https://apps.apple.com/app/mypos"
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              <span aria-hidden="true">🍎</span> {t('download_ios')}
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=uz.mypos"
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              <span aria-hidden="true">▶</span> {t('download_android')}
            </a>
          </div>
        </div>
      ) : null}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <TextField
          id="register-first-name"
          label={t('first_name_label')}
          placeholder={t('first_name_placeholder')}
          autoComplete="given-name"
          autoFocus
          disabled={isSubmitting}
          registration={register('firstName')}
          error={
            errors.firstName
              ? { ...errors.firstName, message: fieldMessage(errors.firstName.message) }
              : undefined
          }
        />

        <PhoneField
          id="register-phone"
          label={t('phone_label')}
          disabled={isSubmitting}
          registration={register('phone')}
          error={
            errors.phone
              ? { ...errors.phone, message: fieldMessage(errors.phone.message) }
              : undefined
          }
        />

        <PasswordField
          id="register-password"
          label={t('password_label')}
          autoComplete="new-password"
          disabled={isSubmitting}
          toggleShowLabel={t('password_show')}
          toggleHideLabel={t('password_hide')}
          registration={register('password')}
          error={
            errors.password
              ? { ...errors.password, message: fieldMessage(errors.password.message) }
              : undefined
          }
        />

        <PasswordField
          id="register-password-confirm"
          label={t('password_confirm_label')}
          autoComplete="new-password"
          disabled={isSubmitting}
          toggleShowLabel={t('password_show')}
          toggleHideLabel={t('password_hide')}
          registration={register('passwordConfirm')}
          error={
            errors.passwordConfirm
              ? {
                  ...errors.passwordConfirm,
                  message: fieldMessage(errors.passwordConfirm.message),
                }
              : undefined
          }
        />

        {serverError ? (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger"
          >
            {serverError}
          </div>
        ) : null}

        <SubmitButton loading={isSubmitting}>{t('submit_register')}</SubmitButton>
      </form>

      <p className="text-center text-sm text-neutral-500">
        {t('have_account')}{' '}
        <Link
          href={`/${localeFromParams}/login` as Route}
          className="font-bold text-brand-500 transition hover:text-brand-600"
        >
          {t('go_login')}
        </Link>
      </p>
    </div>
  );
}
