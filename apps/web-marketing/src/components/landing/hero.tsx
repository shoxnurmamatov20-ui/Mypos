'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, PlayCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatedCounter } from './animations';
import { HeroDashboard } from './hero-dashboard';

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();

  const trustItems = [t('trust_no_card'), t('trust_setup'), t('trust_support')];

  return (
    <section className="modern-gradient ops-grid overflow-hidden text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-xl px-md pb-xl pt-lg sm:px-lg lg:grid-cols-[0.92fr_1.08fr] lg:px-xl lg:pb-[72px] lg:pt-[72px]">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-xs rounded-pill border border-white/[0.12] bg-white/[0.08] px-sm py-xxs text-caption-strong text-white/80 backdrop-blur"
          >
            <span className="h-2 w-2 rounded-pill bg-[#50D1AA]" aria-hidden="true" />
            {t('badge')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.05 }}
            className="mt-md font-display font-semibold text-[64px] leading-[0.92] text-white sm:text-[86px] lg:text-[112px]"
          >
            MyPOS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.12 }}
            className="mt-md max-w-2xl font-display text-[30px] leading-tight text-white sm:text-[38px]"
          >
            {t('title_part1')} <span className="text-coral-on-dark">{t('title_highlight')}</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.18 }}
            className="mt-md max-w-xl text-body text-white/70 sm:text-lead"
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-lg flex flex-col gap-xs sm:flex-row"
          >
            <Link
              href={`/${locale}/get-started`}
              className="inline-flex h-12 items-center justify-center gap-xs rounded-pill bg-tenant px-lg text-body-strong text-tenant-on-primary transition-transform duration-fast active:scale-95"
            >
              {t('cta_primary')}
              <ArrowRight size={20} weight="bold" aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/demo`}
              className="inline-flex h-12 items-center justify-center gap-xs rounded-pill border border-white/[0.14] bg-white/[0.08] px-lg text-body-strong text-white transition-colors duration-fast hover:bg-white/[0.12] active:scale-95"
            >
              <PlayCircle size={20} weight="duotone" className="text-coral-on-dark" aria-hidden="true" />
              {t('cta_secondary')}
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-md flex flex-wrap gap-xs text-caption text-white/70"
          >
            {trustItems.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-xxs rounded-pill bg-white/[0.07] px-sm py-xxs"
              >
                <CheckCircle size={16} weight="fill" className="text-[#50D1AA]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="mt-xl grid grid-cols-2 gap-md border-t border-white/10 pt-md sm:grid-cols-4"
          >
            <Stat value={500} suffix="+" label={t('stat_restaurants')} />
            <Stat value={2} suffix="M+" label={t('stat_orders')} />
            <Stat value={99.9} suffix="%" format={(n) => n.toFixed(1)} label={t('stat_uptime')} />
            <StatLiteral value="24/7" label={t('stat_support')} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <HeroDashboard />
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
      <p className="tabular font-display text-title font-semibold text-white">
        <AnimatedCounter to={value} suffix={suffix} formatNumber={format} />
      </p>
      <p className="mt-xxs text-fine-print text-white/50">{label}</p>
    </div>
  );
}

function StatLiteral({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular font-display text-title font-semibold text-white">{value}</p>
      <p className="mt-xxs text-fine-print text-white/50">{label}</p>
    </div>
  );
}
