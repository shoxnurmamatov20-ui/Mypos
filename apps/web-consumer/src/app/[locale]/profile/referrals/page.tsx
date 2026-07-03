'use client';

import { Check, Copy, Gift, Share2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';

function generateReferralCode(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export default function ReferralsPage() {
  const t = useTranslations('referrals');
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const code = user ? generateReferralCode(user.id) : '------';
  const url = mounted ? `${window.location.origin}/uz/auth/register?ref=${code}` : '';

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (!url || typeof navigator === 'undefined' || !navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: t('share_title'),
        text: t('share_text', { code }),
        url,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
      </header>

      <div className="rounded-3xl bg-gradient-to-br from-brand-primary to-brand-accent p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-6 w-6" />
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
            {t('your_code')}
          </p>
        </div>
        <p className="font-mono text-4xl font-black tracking-tight">{code}</p>
        <p className="mt-3 text-sm opacity-90">{t('benefit')}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-neutral-200 bg-white py-3 font-bold text-neutral-900 transition active:scale-95 hover:border-brand-primary"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? t('copied') : t('copy_link')}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3 font-bold text-white transition active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          {t('share')}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-neutral-900 mb-3">
          {t('how_it_works')}
        </h2>
        <ol className="grid gap-3">
          {(['step_1', 'step_2', 'step_3'] as const).map((key, i) => (
            <li key={key} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm">
                {i + 1}
              </span>
              <p className="text-sm text-neutral-700">{t(key)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-neutral-400" />
          <h3 className="font-bold text-neutral-900">{t('invited_count')}</h3>
        </div>
        <p className="text-3xl font-black text-brand-primary tabular-nums">0</p>
        <p className="mt-1 text-xs text-neutral-500">{t('invited_hint')}</p>
      </div>
    </div>
  );
}
