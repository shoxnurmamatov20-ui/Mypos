'use client';

import { authApi, ApiError, type AuthUser } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient, clearToken, getStoredToken } from '@/lib/api';

export function DashboardHome() {
  const t = useTranslations('dashboard');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me(apiClient)
      .then((response) => {
        setUser(response.data);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout(apiClient);
    } catch {
      // ignore - just clear local token
    }
    clearToken();
    window.location.href = '/uz/login';
  };

  if (loading) {
    return <div className="text-neutral-500">...</div>;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center">
        <p className="mb-4 text-neutral-600">Tizimga kirilmagan</p>
        <Link
          href="/uz/login"
          className="inline-flex items-center rounded-lg bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
        >
          Kirish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-neutral-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              {t('welcome', { name: user.name })}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
            <div className="mt-3 flex gap-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {role}
                </span>
              ))}
              {user.is_super_admin && (
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  super_admin
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('logout')}
          </button>
        </div>
      </div>

      {user.tenant && (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-neutral-200">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Restoran</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-neutral-500">Nomi</dt>
              <dd className="font-medium text-neutral-900">{user.tenant.name}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Plan</dt>
              <dd className="font-medium text-neutral-900">{user.tenant.plan}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Status</dt>
              <dd className="font-medium text-neutral-900">
                <span className="inline-flex items-center rounded-full bg-mint-50 px-2.5 py-0.5 text-xs font-medium text-mint-700">
                  {user.tenant.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Valyuta</dt>
              <dd className="font-medium text-neutral-900">{user.tenant.default_currency}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
