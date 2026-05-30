'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError, login } from '@/lib/api';
import { resolvePostLoginTarget } from '@/lib/post-login';
import { persistWaiterSession } from '@/lib/waiter-session';
import { Field } from '@/components/Field';

const schema = z.object({
  identifier: z.string().min(1, 'required').email('invalid_email'),
  password: z.string().min(1, 'required'),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS: Array<{ label: string; email: string; password: string }> = [
  { label: 'Super Admin', email: 'admin@mypos.uz', password: 'admin123' },
  { label: 'CEO',         email: 'ceo@mypos.uz', password: 'ceo123' },
  { label: 'Manager',     email: 'manager@demo.mypos.uz', password: 'demo123' },
  { label: 'Cashier',     email: 'cashier1@demo.mypos.uz', password: 'demo123' },
  { label: 'Chef',        email: 'chef@demo.mypos.uz', password: 'demo123' },
  { label: 'Waiter',      email: 'waiter@demo.mypos.uz', password: 'demo123' },
];

/**
 * Every possible post-login destination. As soon as the user lands on
 * /login we warm the HTTP cache by issuing prefetch hints for each
 * panel, so by the time `window.location.href = ...` fires the target
 * HTML + JS bundle are already in the browser cache. Cuts the visible
 * tab-spinner time to near zero on subsequent navigations.
 */
const PANEL_PREFETCH_PATHS: Record<string, string> = {
  super_admin: '/panel/admin/uz/dashboard',
  ceo:         '/panel/ceo/uz/overview',
  owner:       '/panel/manager/uz/overview',
  manager:     '/panel/manager/uz/overview',
  cashier:     '/panel/cashier/uz/pos',
  chef:        '/panel/kitchen/board',
  waiter:      '/panel/portal/uz/tables',
  customer:    '/panel/consumer/uz',
};

export function LoginForm() {
  const t = useTranslations('login');
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);

  // Prefetch every potential landing page so the post-login navigation
  // doesn't show a long browser spinner. <link rel="prefetch"> tells the
  // browser to fetch the resource at idle priority — invisible to the user.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const links: HTMLLinkElement[] = [];
    for (const path of Object.values(PANEL_PREFETCH_PATHS)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.as = 'document';
      document.head.appendChild(link);
      links.push(link);
    }
    return () => {
      for (const l of links) l.parentNode?.removeChild(l);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '', remember: false },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const result = await login({
        identifier: values.identifier,
        password: values.password,
      });

      if (typeof window !== 'undefined') {
        // Persist the session for the same-origin waiter panel.
        persistWaiterSession({
          token: result.token,
          role: result.role,
          name: result.user.name,
          tenantName: result.user.tenant?.name ?? 'MyPOS',
        });

        const target = resolvePostLoginTarget(result.role, locale);
        if (target.kind === 'internal') {
          // Waiter: the panel lives in this same app — go straight there.
          window.location.href = target.path;
          return;
        }

        // Every other role: go DIRECTLY to its panel. No /dispatch hop.
        // The hash carries the token so the target app's AuthGate can pick
        // it up on first paint, identical to the previous flow but without
        // the intermediate spinner.
        const url = new URL(result.redirect_url);
        url.hash = `token=${encodeURIComponent(result.token)}&role=${encodeURIComponent(result.role)}`;
        window.location.href = url.toString();
        return;
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 422) {
          for (const [field, messages] of Object.entries(e.errors)) {
            if (field in (schema.shape as Record<string, unknown>) && messages[0]) {
              setError(field as keyof FormValues, { message: messages[0] });
            }
          }
          if (e.errors.identifier?.[0]) {
            setServerError(t('errors.invalid'));
          }
        } else if (e.status === 429) {
          setServerError(t('errors.rate_limited', { seconds: 60 }));
        } else {
          setServerError(t('errors.invalid'));
        }
      } else {
        setServerError(t('errors.server'));
      }
    }
  };

  const fillDemo = (acct: (typeof DEMO_ACCOUNTS)[number]) => {
    setValue('identifier', acct.email);
    setValue('password', acct.password);
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white p-[32px] animate-fade-in">
      <header className="mb-[24px] flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
          <ShoppingBagIcon />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-black leading-tight">
            MyPOS Portal
          </h1>
          <p className="text-[13px] text-black/60 leading-tight mt-[2px]">
            {t('email_label')} va {t('password_label').toLowerCase()}ni kiriting
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label={t('email_label')}
          type="email"
          autoComplete="email"
          autoFocus
          placeholder={t('email_placeholder')}
          error={errors.identifier?.message ? t('errors.invalid') : undefined}
          {...register('identifier')}
        />

        <Field
          label={t('password_label')}
          type="password"
          autoComplete="current-password"
          placeholder={t('password_placeholder')}
          error={errors.password?.message ? t('errors.invalid') : undefined}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-[12px]">
          <label className="flex items-center gap-2 cursor-pointer text-black/60 hover:text-black select-none">
            <input
              type="checkbox"
              className="size-[14px] rounded border-black/30 accent-black"
              {...register('remember')}
            />
            <span>{t('remember_me')}</span>
          </label>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-black hover:underline"
          >
            {t('forgot_password')}
          </Link>
        </div>

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
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-[10px] text-[14px] font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>

      <div className="mt-6 border-t border-black/10 pt-5">
        <p className="text-[12px] text-black/60 mb-2">
          Tezkor sinash uchun rolni tanlang:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((acct) => (
            <button
              key={acct.email}
              type="button"
              onClick={() => fillDemo(acct)}
              className="rounded-md border border-black/15 bg-white px-2.5 py-1 text-[12px] font-medium text-black transition hover:border-black hover:bg-black hover:text-white active:scale-[0.98]"
            >
              {acct.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-black/60">
        {t('no_account')}{' '}
        <a
          href={`http://localhost:3000/${locale}/get-started`}
          className="font-semibold text-black hover:underline"
        >
          {t('create_account')}
        </a>
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M8 2A6 6 0 0114 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3.5 6h13l-1 11.5a1 1 0 01-1 .9H5.5a1 1 0 01-1-.9L3.5 6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 6V4.5a3 3 0 016 0V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
