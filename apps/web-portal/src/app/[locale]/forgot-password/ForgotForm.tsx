'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field } from '@/components/Field';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export function ForgotForm({ locale }: { locale: string }) {
  const t = useTranslations('forgot');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      // Backend endpoint TBD (Laravel password reset). For now we
      // optimistically show the success message — the email infra is
      // gated behind production setup. The response shape will match
      // the standard Laravel password reset broker.
      await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).catch(() => null);
    } finally {
      setSubmitted(values.email);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-md py-md">
        <h2 className="font-display text-display-md text-ink">{t('title')}</h2>
        <p className="text-body text-ink">
          {t('success', { email: submitted })}
        </p>
        <Link
          href={`/${locale}/login`}
          className="text-tenant hover:underline text-body"
        >
          {t('back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-md" noValidate>
      <h2 className="font-display text-display-md text-ink">{t('title')}</h2>
      <p className="text-body text-ink-muted-48">{t('subtitle')}</p>

      <Field
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="you@restaurant.uz"
        error={errors.email?.message}
        {...register('email')}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-tenant text-white rounded-pill h-12 text-button-large active:scale-95 transition-transform disabled:opacity-60"
      >
        {t('submit')}
      </button>

      <Link
        href={`/${locale}/login`}
        className="text-center text-caption text-ink-muted-48 hover:text-ink"
      >
        {t('back_to_login')}
      </Link>
    </form>
  );
}
