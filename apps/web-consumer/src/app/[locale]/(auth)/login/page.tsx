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
import { useAuthStore } from '@/stores/auth';
import { PasswordField } from '../_components/password-field';
import { PhoneField } from '../_components/phone-field';
import { SocialLogin } from '../_components/social-login';
import { SubmitButton } from '../_components/submit-button';

const LoginSchema = z.object({
  phone: z.string().regex(/^\d{9}$/, { message: 'phone_invalid' }),
  password: z.string().min(6, { message: 'password_too_short' }),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const localeFromParams = params?.locale ?? locale;
  const login = useAuthStore((s) => s.login);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(`+998${values.phone}`, values.password);
      router.push(`/${localeFromParams}` as Route);
    } catch (err) {
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
          {t('login_title')}
        </h1>
        <p className="text-base text-neutral-500">{t('login_subtitle')}</p>
      </header>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <PhoneField
          id="login-phone"
          label={t('phone_label')}
          autoFocus
          disabled={isSubmitting}
          registration={register('phone')}
          error={
            errors.phone
              ? { ...errors.phone, message: fieldMessage(errors.phone.message) }
              : undefined
          }
        />

        <PasswordField
          id="login-password"
          label={t('password_label')}
          autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            href={`/${localeFromParams}/forgot-password` as Route}
            className="text-sm font-semibold text-brand-500 transition hover:text-brand-600"
          >
            {t('forgot_password')}
          </Link>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger"
          >
            {serverError}
          </div>
        ) : null}

        <SubmitButton loading={isSubmitting}>{t('submit_login')}</SubmitButton>
      </form>

      <SocialLogin
        divider={t('or_divider')}
        googleLabel={t('social_google')}
        appleLabel={t('social_apple')}
        comingSoonLabel={t('social_coming_soon')}
      />

      <p className="text-center text-sm text-neutral-500">
        {t('no_account')}{' '}
        <Link
          href={`/${localeFromParams}/register` as Route}
          className="font-bold text-brand-500 transition hover:text-brand-600"
        >
          {t('go_register')}
        </Link>
      </p>
    </div>
  );
}
