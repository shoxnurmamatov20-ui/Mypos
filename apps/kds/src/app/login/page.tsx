'use client';

import { ApiError, authApi } from '@mypos/api-client';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { apiClient, storeToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Email va parolni kiriting');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.login(apiClient, {
        identifier: identifier.trim(),
        password,
      });
      storeToken(response.data.token);
      router.replace('/board');
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setError(body?.message ?? 'Tizimga kirishda xatolik');
      } else {
        setError('Tarmoq xatosi. Qayta urinib ko\u2018ring');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex h-screen items-center justify-center bg-neutral-900 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-5xl font-bold text-brand-400">
            MyPOS Kitchen
          </h1>
          <p className="mt-3 text-lg text-neutral-400">
            Oshxona ekraniga kirish
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-neutral-700 bg-neutral-800 p-8 shadow-xl"
        >
          <div className="mb-5">
            <label
              htmlFor="identifier"
              className="mb-2 block text-base font-medium text-neutral-200"
            >
              Email
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="owner@demo.mypos.uz"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="block w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-lg text-neutral-50 placeholder-neutral-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-base font-medium text-neutral-200"
            >
              Parol
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-lg text-neutral-50 placeholder-neutral-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            />
          </div>
          {error !== null && (
            <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-500 px-4 py-4 text-xl font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Kirish...' : 'Kirish'}
          </button>
        </form>
      </div>
    </main>
  );
}
