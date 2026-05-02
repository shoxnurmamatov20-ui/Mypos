'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatedCounter } from './animations';
import { HeroDashboard } from './hero-dashboard';

/**
 * Apple-style hero — edge-to-edge canvas tile, 80px section padding.
 *
 * Anatomy (Apple's "story tile" pattern):
 *   tagline  →  hero-display headline (with italic accent)  →  lead subcopy  →  pill CTAs  →  product render
 *
 * Discipline:
 *   - text-hero-display (56px / 600 / -0.28px)
 *   - rounded-pill on primary CTA, active:scale-95 press
 *   - shadow-product on product imagery only (HeroDashboard)
 *   - No mesh gradients, no SVG underlines, no text gradients
 */
export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        {/* Top tagline */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-tagline text-coral text-center font-display"
        >
          MyPOS
        </motion.p>

        {/* Hero headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="tracking-hero mt-sm text-center text-hero-display text-ink font-display"
          style={{ letterSpacing: '-0.28px' }}
        >
          {t('title_part1')} <em className="italic font-semibold">{t('title_highlight')}</em>
        </motion.h1>

        {/* Lead body */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-md max-w-[680px] text-center text-lead text-ink font-display"
        >
          {t('subtitle')}
        </motion.p>

        {/* Pill CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-md flex flex-col items-center justify-center gap-xs sm:flex-row sm:gap-md"
        >
          <Link
            href={`/${locale}/get-started`}
            className="inline-flex h-12 items-center rounded-pill bg-tenant px-lg text-body text-tenant-on-primary transition-transform duration-fast active:scale-95"
          >
            {t('cta_primary')}
          </Link>
          <Link
            href={`/${locale}/demo`}
            className="inline-flex h-12 items-center text-body text-coral transition-transform duration-fast active:scale-95"
          >
            {t('cta_secondary')} <span className="ml-xxs">›</span>
          </Link>
        </motion.div>

        {/* Trust micro-row */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-md text-center text-fine-print text-ink-muted-48"
        >
          {t('trust_no_card')} · {t('trust_setup')} · {t('trust_support')}
        </motion.p>

        {/* Product render with single drop-shadow */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-xxl"
        >
          <div className="shadow-product mx-auto max-w-5xl">
            <HeroDashboard />
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-xxl grid grid-cols-2 gap-md border-t border-hairline pt-xl text-center sm:grid-cols-4"
        >
          <Stat value={500} suffix="+" label={t('stat_restaurants')} />
          <Stat value={2} suffix="M+" label={t('stat_orders')} />
          <Stat
            value={99.9}
            suffix="%"
            format={(n) => n.toFixed(1)}
            label={t('stat_uptime')}
          />
          <StatLiteral value="24/7" label={t('stat_support')} />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({
  value,
  suffix,
  format,
  label,
}: {
  value: number;
  suffix?: string;
  format?: (n: number) => string;
  label: string;
}) {
  return (
    <div>
      <p className="tabular text-display-lg text-ink font-display font-semibold">
        <AnimatedCounter to={value} suffix={suffix} formatNumber={format} />
      </p>
      <p className="mt-xxs text-caption text-ink-muted-48">{label}</p>
    </div>
  );
}

function StatLiteral({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular text-display-lg text-ink font-display font-semibold">{value}</p>
      <p className="mt-xxs text-caption text-ink-muted-48">{label}</p>
    </div>
  );
}
