'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@mypos/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Toast, useToast } from '@/components/ui/toast';
import { type CreateTenantPayload, createTenant } from '@/lib/api-helpers';
import type { TenantPlan } from '@/types/super-admin';
import {
  type LocaleValue,
  NewTenantSchema,
  type NewTenantValues,
  slugify,
  type TrialDays,
} from './_new-tenant-schema';
import { NewTenantPreview } from './new-tenant-preview';
import { PasswordStrengthMeter } from './password-strength-meter';

type Props = {
  locale: string;
};

/**
 * Create-tenant flow — submits to `POST /api/v1/super-admin/tenants` via
 * a TanStack mutation. On 422 we map backend `errors` map back into the
 * form fields; on success we invalidate the list cache and redirect to
 * the new tenant's detail page.
 */
export function NewTenantForm({ locale }: Props) {
  const t = useTranslations('tenant_new');
  const tPlans = useTranslations('plans');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state: toastState, show: showToast, close: closeToast } = useToast();

  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewTenantValues>({
    resolver: zodResolver(NewTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      plan: 'starter',
      trial_days: '14',
      locale: 'uz',
      currency: 'UZS',
      owner_name: '',
      owner_email: '',
      owner_phone: '',
      owner_password: '',
    },
  });

  const watched = useWatch({ control });

  // Auto-generate slug from name until the user manually edits it.
  useEffect(() => {
    if (!slugTouched && watched.name) {
      setValue('slug', slugify(watched.name), { shouldValidate: false });
    }
  }, [watched.name, slugTouched, setValue]);

  const planOptions: SelectOption<TenantPlan>[] = [
    { value: 'free', label: tPlans('free'), hint: "0 so'm / oy" },
    { value: 'starter', label: tPlans('starter'), hint: "99 000 so'm / oy" },
    { value: 'pro', label: tPlans('pro'), hint: "250 000 so'm / oy" },
    { value: 'business', label: tPlans('business'), hint: "490 000 so'm / oy" },
    { value: 'enterprise', label: tPlans('enterprise'), hint: "1 200 000 so'm / oy" },
  ];

  const trialOptions: SelectOption<TrialDays>[] = [
    { value: '0', label: t('trial_0_days') },
    { value: '7', label: t('trial_7_days') },
    { value: '14', label: t('trial_14_days') },
    { value: '30', label: t('trial_30_days') },
  ];

  const localeOptions: SelectOption<LocaleValue>[] = [
    { value: 'uz', label: "O'zbekcha" },
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
    { value: 'kz', label: 'Қазақша' },
  ];

  const currencyOptions: SelectOption<'UZS'>[] = [{ value: 'UZS', label: "UZS — so'm" }];

  const fieldError = (key: string | undefined) =>
    key ? t(key as 'validation_name_required') : null;

  const mutation = useMutation({
    mutationFn: (payload: CreateTenantPayload) => createTenant(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      showToast(t('submit'), 'success');
      router.push(`/${locale}/tenants/${data.tenant.id}` as Route);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as
          | { message?: string; errors?: Record<string, string[]> }
          | undefined;
        if (body?.errors) {
          // Map snake_case server keys back into the form's field names.
          for (const [key, msgs] of Object.entries(body.errors)) {
            const msg = Array.isArray(msgs) ? msgs[0] : undefined;
            if (!msg) continue;
            setError(key as keyof NewTenantValues, { type: 'server', message: msg });
          }
        }
        setServerError(body?.message ?? t('submit_error'));
        return;
      }
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setServerError(body?.message ?? t('submit_error'));
        return;
      }
      setServerError(t('submit_error'));
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const payload: CreateTenantPayload = {
      name: values.name,
      slug: values.slug,
      owner_name: values.owner_name,
      owner_email: values.owner_email,
      owner_phone: values.owner_phone || undefined,
      owner_password: values.owner_password,
      plan: values.plan,
      trial_days: Number(values.trial_days),
      default_locale: values.locale === 'kz' ? 'uz' : (values.locale as 'uz' | 'ru' | 'en'),
      default_currency: values.currency,
    };
    mutation.mutate(payload);
  });

  const submitting = isSubmitting || mutation.isPending;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Link
          href={`/${locale}/tenants` as Route}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#62716d] dark:text-[#94a3b8] transition-colors hover:text-[#16221f] dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120] rounded"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('back_to_list')}</span>
        </Link>
        <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-[#16221f] dark:text-white leading-tight tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-[#62716d] dark:text-[#94a3b8]">{t('subtitle')}</p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[2fr_1fr]"
      >
        <div className="space-y-4 md:space-y-6">
          {/* Tenant section */}
          <fieldset className="space-y-5 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 md:p-6 transition-colors">
            <legend className="px-1 text-base font-bold text-[#16221f] dark:text-white">
              {t('section_tenant')}
            </legend>

            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
              >
                {t('field_name')}
              </label>
              <Input
                id="name"
                placeholder={t('field_name_placeholder')}
                autoFocus
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
                  {fieldError(errors.name.message)}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="slug"
                className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
              >
                {t('field_slug')}
              </label>
              <Input
                id="slug"
                placeholder={t('field_slug_placeholder')}
                className="font-mono"
                aria-invalid={!!errors.slug}
                {...register('slug')}
                onChange={(event) => {
                  setSlugTouched(true);
                  register('slug').onChange(event);
                }}
              />
              <p className="mt-1 text-xs text-[#62716d] dark:text-[#94a3b8]">
                {t('field_slug_hint')}
              </p>
              {errors.slug ? (
                <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
                  {fieldError(errors.slug.message)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Controller
                control={control}
                name="plan"
                render={({ field }) => (
                  <Select<TenantPlan>
                    value={field.value}
                    onChange={field.onChange}
                    options={planOptions}
                    label={t('field_plan')}
                  />
                )}
              />
              <Controller
                control={control}
                name="trial_days"
                render={({ field }) => (
                  <Select<TrialDays>
                    value={field.value}
                    onChange={field.onChange}
                    options={trialOptions}
                    label={t('field_trial_days')}
                  />
                )}
              />
              <Controller
                control={control}
                name="locale"
                render={({ field }) => (
                  <Select<LocaleValue>
                    value={field.value}
                    onChange={field.onChange}
                    options={localeOptions}
                    label={t('field_locale')}
                  />
                )}
              />
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select<'UZS'>
                    value={field.value}
                    onChange={field.onChange}
                    options={currencyOptions}
                    label={t('field_currency')}
                    disabled
                  />
                )}
              />
            </div>
          </fieldset>

          {/* Owner section */}
          <fieldset className="space-y-5 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-4 md:p-6 transition-colors">
            <legend className="px-1 text-base font-bold text-[#16221f] dark:text-white">
              {t('section_owner')}
            </legend>

            <div>
              <label
                htmlFor="owner-name"
                className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
              >
                {t('field_owner_name')}
              </label>
              <Input
                id="owner-name"
                placeholder={t('field_owner_name_placeholder')}
                aria-invalid={!!errors.owner_name}
                {...register('owner_name')}
              />
              {errors.owner_name ? (
                <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
                  {fieldError(errors.owner_name.message)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label
                  htmlFor="owner-email"
                  className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
                >
                  {t('field_owner_email')}
                </label>
                <Input
                  id="owner-email"
                  type="email"
                  autoComplete="email"
                  className="font-mono"
                  placeholder={t('field_owner_email_placeholder')}
                  aria-invalid={!!errors.owner_email}
                  {...register('owner_email')}
                />
                {errors.owner_email ? (
                  <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
                    {fieldError(errors.owner_email.message)}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="owner-phone"
                  className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
                >
                  {t('field_owner_phone')}
                </label>
                <Input
                  id="owner-phone"
                  type="tel"
                  autoComplete="tel"
                  className="font-mono"
                  placeholder={t('field_owner_phone_placeholder')}
                  aria-invalid={!!errors.owner_phone}
                  {...register('owner_phone')}
                />
                {errors.owner_phone ? (
                  <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
                    {fieldError(errors.owner_phone.message)}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="owner-password"
                className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
              >
                {t('field_owner_password')}
              </label>
              <Input
                id="owner-password"
                type="password"
                autoComplete="new-password"
                placeholder={t('field_owner_password_placeholder')}
                aria-invalid={!!errors.owner_password}
                {...register('owner_password')}
              />
              <PasswordStrengthMeter value={watched.owner_password ?? ''} />
              {errors.owner_password ? (
                <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
                  {fieldError(errors.owner_password.message)}
                </p>
              ) : null}
            </div>
          </fieldset>

          {serverError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-[#b42318] dark:text-red-200"
            >
              {serverError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <Link
              href={`/${locale}/tenants` as Route}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-4 text-sm font-semibold text-[#16221f] dark:text-gray-200 transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] w-full sm:w-auto active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
            >
              {tCommon('cancel')}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0f766e] hover:bg-[#0b5e57] px-5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              <span>{submitting ? t('submit_loading') : t('submit')}</span>
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <NewTenantPreview
            name={watched.name ?? ''}
            slug={watched.slug ?? ''}
            plan={(watched.plan ?? 'starter') as TenantPlan}
            trialDays={(watched.trial_days ?? '14') as TrialDays}
            ownerName={watched.owner_name ?? ''}
          />
        </aside>
      </form>

      <Toast
        open={toastState.open}
        message={toastState.message}
        variant={toastState.variant}
        onClose={closeToast}
      />
    </div>
  );
}
