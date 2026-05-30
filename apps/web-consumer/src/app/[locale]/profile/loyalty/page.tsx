'use client';

import { ArrowLeft, Check } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

type Tier = {
  key: TierKey;
  emoji: string;
  minPoints: number;
  /** UZ translation. Mock — i18n keys would inflate the JSON. */
  labels: Record<'uz' | 'ru' | 'en', string>;
};

const TIERS: readonly Tier[] = [
  {
    key: 'bronze',
    emoji: '🥉',
    minPoints: 0,
    labels: { uz: 'Bronze', ru: 'Бронза', en: 'Bronze' },
  },
  {
    key: 'silver',
    emoji: '🥈',
    minPoints: 500,
    labels: { uz: 'Silver', ru: 'Серебро', en: 'Silver' },
  },
  {
    key: 'gold',
    emoji: '🥇',
    minPoints: 2000,
    labels: { uz: 'Gold', ru: 'Золото', en: 'Gold' },
  },
  {
    key: 'platinum',
    emoji: '💎',
    minPoints: 5000,
    labels: { uz: 'Platinum', ru: 'Платина', en: 'Platinum' },
  },
] as const;

const CURRENT_POINTS = 245;
const CURRENT_TIER: TierKey = 'bronze';

function findNextTier(current: TierKey): Tier | null {
  const idx = TIERS.findIndex((t) => t.key === current);
  if (idx < 0 || idx === TIERS.length - 1) return null;
  return TIERS[idx + 1] ?? null;
}

export default function LoyaltyPage() {
  const t = useTranslations('loyalty_page');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const tierLocale: 'uz' | 'ru' | 'en' =
    locale === 'ru' || locale === 'en' ? locale : 'uz';

  const tierName = (key: TierKey) =>
    TIERS.find((tier) => tier.key === key)?.labels[tierLocale] ?? key;
  const nextTier = findNextTier(CURRENT_TIER);
  const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - CURRENT_POINTS) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/${locale}/profile` as Route}
          aria-label={tCommon('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-neutral-900 sm:text-3xl">
          {t('title')}
        </h1>
      </header>

      <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-400 to-yellow-600 p-8 text-center text-white">
        <p className="text-7xl" aria-hidden="true">
          🏆
        </p>
        <h2 className="mt-3 font-display text-2xl font-extrabold">
          {t('current_tier', { tier: tierName(CURRENT_TIER) })}
        </h2>
        <p className="mt-2 font-display text-5xl font-extrabold">
          {CURRENT_POINTS}{' '}
          <span className="text-2xl font-bold text-white/80">{t('points_label')}</span>
        </p>
        {nextTier ? (
          <p className="mt-2 text-sm text-white/80">
            {t('to_next', { tier: tierName(nextTier.key), points: pointsToNext })}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          {t('tiers_title')}
        </h3>
        <ul className="mt-3 flex flex-col divide-y divide-neutral-100">
          {TIERS.map((tier) => {
            const achieved = CURRENT_POINTS >= tier.minPoints;
            const isCurrent = tier.key === CURRENT_TIER;
            const rowClass = isCurrent
              ? 'flex items-center gap-4 rounded-xl bg-brand-50 px-3 py-3'
              : 'flex items-center gap-4 px-3 py-3';
            return (
              <li key={tier.key} className={rowClass}>
                <span className="text-3xl" aria-hidden="true">
                  {tier.emoji}
                </span>
                <div className="flex-1">
                  <p className="text-base font-bold text-neutral-900">
                    {tier.labels[tierLocale]}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {tier.minPoints}+ {t('points_label')}
                  </p>
                </div>
                {achieved ? (
                  <Check className="h-5 w-5 text-mint-600" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
