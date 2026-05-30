'use client';

import { CreditCard, Plus, Trash2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type PaymentMethod = {
  id: string;
  provider: 'click' | 'payme' | 'uzum' | 'card';
  last4: string;
  brand?: string;
  expires?: string;
  added_at: string;
  is_default: boolean;
};

const STORAGE_KEY = 'mypos_consumer_payment_methods';

function loadMethods(): PaymentMethod[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PaymentMethod[];
  } catch {
    return [];
  }
}

function saveMethods(items: PaymentMethod[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const PROVIDER_META: Record<PaymentMethod['provider'], { label: string; emoji: string; color: string }> = {
  click: { label: 'Click', emoji: '⚡', color: 'bg-sky-100' },
  payme: { label: 'Payme', emoji: '💜', color: 'bg-purple-100' },
  uzum: { label: 'Uzum', emoji: '🟡', color: 'bg-amber-100' },
  card: { label: 'Card', emoji: '💳', color: 'bg-neutral-100' },
};

export default function PaymentMethodsPage() {
  const t = useTranslations('payment_methods');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMethods(loadMethods());
    setMounted(true);
  }, []);

  const setDefault = (id: string) => {
    const next = methods.map((m) => ({ ...m, is_default: m.id === id }));
    setMethods(next);
    saveMethods(next);
  };

  const remove = (id: string) => {
    const next = methods.filter((m) => m.id !== id);
    setMethods(next);
    saveMethods(next);
  };

  const handleAdd = (provider: PaymentMethod['provider']) => {
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    const item: PaymentMethod = {
      id: `pm_${Date.now()}`,
      provider,
      last4,
      brand: provider === 'card' ? 'Humo' : undefined,
      expires: provider === 'card' ? '12/27' : undefined,
      added_at: new Date().toISOString(),
      is_default: methods.length === 0,
    };
    const next = [...methods, item];
    setMethods(next);
    saveMethods(next);
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
      </header>

      {methods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
          <Wallet className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-3 text-base font-bold text-neutral-900">{t('empty_title')}</h3>
          <p className="mt-1 text-sm text-neutral-600">{t('empty_hint')}</p>
        </div>
      ) : (
        <ul className="grid gap-3 mb-6">
          {methods.map((m) => {
            const meta = PROVIDER_META[m.provider];
            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-4 ${m.is_default ? 'border-brand-primary' : 'border-neutral-200'}`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${meta.color}`}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-900">
                    {meta.label}
                    {m.brand && <span className="ml-2 text-sm font-normal text-neutral-600">{m.brand}</span>}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                    •••• {m.last4} {m.expires && `· ${m.expires}`}
                  </p>
                </div>
                {m.is_default ? (
                  <span className="rounded-full bg-brand-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                    {t('default')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDefault(m.id)}
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    {t('make_default')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition"
                  aria-label={t('remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <h2 className="font-display text-lg font-bold text-neutral-900 mb-3">{t('add_new')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['click', 'payme', 'uzum', 'card'] as const).map((p) => {
            const meta = PROVIDER_META[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleAdd(p)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-neutral-200 bg-white py-4 font-bold text-neutral-900 transition active:scale-95 hover:border-brand-primary"
              >
                <span className="text-xl">{meta.emoji}</span>
                <span>{meta.label}</span>
                <Plus className="h-4 w-4 text-neutral-400" />
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          <CreditCard className="inline h-3 w-3 mr-1" />
          {t('tokenize_note')}
        </p>
      </div>
    </div>
  );
}
