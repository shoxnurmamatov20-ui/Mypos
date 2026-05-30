'use client';

import { ArrowRight, PlayCircle } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

const STATS = [
  { value: '500+',  key: 'stat_restaurants' },
  { value: '1M+',   key: 'stat_orders' },
  { value: '99.9%', key: 'stat_uptime' },
  { value: '24/7',  key: 'stat_support' },
] as const;

/**
 * Hero — always-dark teal canvas (#001B1B → #022F2F radial gradient)
 * regardless of page theme, so the section reads as a single emerald
 * stage like the Operatora reference. The `dark` wrapper forces every
 * `dark:` variant on its children — even when the rest of the page is
 * in light mode.
 */
export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <div className="dark">
      <section
        className="relative overflow-hidden bg-[#001B1B]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 1200px 600px at 50% -200px, rgba(20, 184, 166, 0.20), transparent 60%), radial-gradient(ellipse 800px 400px at 80% 60%, rgba(1, 77, 78, 0.40), transparent 60%)',
        }}
      >
        <div className="relative mx-auto max-w-5xl px-5 pt-24 sm:pt-32 pb-20 text-center">
          {/* Headline */}
          <h1 className="mx-auto max-w-3xl text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold leading-[1.05] tracking-tight text-white">
            {t('title_part1')}{' '}
            <span className="gradient-teal">{t('title_highlight')}</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-[36rem] text-[16px] sm:text-[17px] leading-relaxed text-white/70">
            {t('subtitle')}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/get-started`}
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[14px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
            >
              {t('cta_primary')}
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href={`/${locale}/demo`}
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full border border-white/15 bg-white/[0.06] text-white text-[14px] font-bold backdrop-blur-sm hover:bg-white/[0.12] transition-colors"
            >
              <PlayCircle size={16} weight="fill" />
              {t('cta_secondary')}
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-4 text-[12.5px] text-white/50">
            {t('trust_no_card')} · {t('trust_setup')} · {t('trust_support')}
          </p>

          {/* Stats card */}
          <div className="glass-card mx-auto mt-14 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {STATS.map((s) => (
              <div
                key={s.key}
                className="px-4 py-5 sm:py-6 text-center bg-white/[0.02]"
              >
                <div className="tabular text-[28px] sm:text-[32px] font-extrabold leading-none text-white">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[12px] font-semibold text-white/60">
                  {t(s.key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
