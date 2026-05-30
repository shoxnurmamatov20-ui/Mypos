'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PhoneField } from '../_components/phone-field';
import { SubmitButton } from '../_components/submit-button';

const ForgotSchema = z.object({
  phone: z.string().regex(/^\d{9}$/, { message: 'phone_invalid' }),
});

type ForgotValues = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const localeFromParams = params?.locale ?? locale;

  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async () => {
    // Backend endpoint not implemented yet — show a friendly demo confirmation.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
  });

  const fieldMessage = (key?: string) => (key ? t(key) : undefined);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold text-neutral-900 sm:text-4xl">
          {t('forgot_title')}
        </h1>
        <p className="text-base text-neutral-500">{t('forgot_subtitle')}</p>
      </header>

      {submitted ? (
        <div
          role="status"
          className="flex flex-col items-start gap-3 rounded-2xl border border-mint-200 bg-mint-50 p-5"
        >
          <div className="flex items-center gap-2 text-mint-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span className="font-bold">OK</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-mint-800">{t('reset_sent')}</p>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <PhoneField
            id="forgot-phone"
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

          <SubmitButton loading={isSubmitting}>{t('send_reset')}</SubmitButton>
        </form>
      )}

      <Link
        href={`/${localeFromParams}/login` as Route}
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-brand-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{t('back_to_login')}</span>
      </Link>
    </div>
  );
}
