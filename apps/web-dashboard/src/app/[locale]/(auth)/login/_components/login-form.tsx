'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, authApi } from '@mypos/api-client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiClient, storeToken } from '@/lib/api';

const LoginSchema = z.object({
  identifier: z.string().min(3, 'Email yoki telefon kiriting'),
  password: z.string().min(1, 'Parolni kiriting'),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login(apiClient, data);
      storeToken(response.data.token);
      toast.success(t('success', { name: response.data.user.name }));
      router.push('/uz');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        toast.error(body?.message ?? t('error_generic'));
      } else {
        toast.error(t('error_network'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-neutral-700">
          {t('identifier')}
        </label>
        <input
          id="identifier"
          type="text"
          autoComplete="username"
          autoFocus
          placeholder="owner@demo.mypos.uz"
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          {...register('identifier')}
        />
        {errors.identifier && (
          <p className="mt-1 text-sm text-danger">{errors.identifier.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
          {t('password')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand-500 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
