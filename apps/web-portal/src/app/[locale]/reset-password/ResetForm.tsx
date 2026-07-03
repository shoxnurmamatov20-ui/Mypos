'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field } from '@/components/Field';
import { ApiError, resetPassword } from '@/lib/api';

const schema = z
  .object({
    password: z.string().min(8, 'min'),
    password_confirmation: z.string().min(8, 'min'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'mismatch',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetForm({ locale }: { locale: string }) {
  const t = useTranslations('reset');
  const search = useSearchParams();
  const token = search?.get('token') ?? '';
  const email = search?.get('email') ?? '';
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', password_confirmation: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!token || !email) {
      setServerError(t('errors.invalid_link'));
      return;
    }

    try {
      await resetPassword({
        token,
        email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 422) {
          for (const [field, messages] of Object.entries(e.errors)) {
            if (field === 'password' && messages[0]) {
              setError('password', { message: messages[0] });
            }
          }
          if (e.errors.email) {
            setServerError(t('errors.invalid_link'));
          } else {
            setServerError(t('errors.server'));
          }
        } else {
          setServerError(t('errors.server'));
        }
      } else {
        setServerError(t('errors.server'));
      }
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-[32px] animate-fade-in">
        <header className="mb-[16px] flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
            ✓
          </div>
          <h1 className="text-[18px] font-bold text-black leading-tight">{t('success_title')}</h1>
        </header>
        <p className="text-[14px] text-black/70 mb-6">{t('success_body')}</p>
        <Link
          href={`/${locale}/login`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-[10px] text-[14px] font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
        >
          {t('back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-[32px] animate-fade-in">
      <header className="mb-[24px]">
        <h1 className="text-[18px] font-bold text-black leading-tight">{t('title')}</h1>
        <p className="text-[13px] text-black/60 mt-[4px]">
          {email ? t('subtitle', { email }) : t('subtitle_no_email')}
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label={t('password_label')}
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder={t('password_placeholder')}
          error={errors.password?.message ? t('errors.min_8') : undefined}
          {...register('password')}
        />

        <Field
          label={t('confirm_label')}
          type="password"
          autoComplete="new-password"
          placeholder={t('confirm_placeholder')}
          error={errors.password_confirmation?.message ? t('errors.mismatch') : undefined}
          {...register('password_confirmation')}
        />

        {serverError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700"
            role="alert"
          >
            {serverError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !token}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-[10px] text-[14px] font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>

        <Link
          href={`/${locale}/login`}
          className="block text-center text-[12px] text-black/60 hover:text-black"
        >
          {t('back_to_login')}
        </Link>
      </form>
    </div>
  );
}
