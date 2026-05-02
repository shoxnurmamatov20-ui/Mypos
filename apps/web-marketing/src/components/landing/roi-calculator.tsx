'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Coins, type Icon, TrendUp } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { FadeUp } from './animations';

type LocaleKey = 'uz' | 'ru' | 'en';

function formatUZS(amount: number, locale: LocaleKey): string {
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1);
    const suffix = locale === 'uz' ? "mln so'm" : locale === 'ru' ? 'млн сум' : 'M UZS';
    return `${millions} ${suffix}`;
  }
  const formatted = Math.round(amount).toLocaleString('en-US').replace(/,/g, ' ');
  const suffix = locale === 'uz' ? "so'm" : locale === 'ru' ? 'сум' : 'UZS';
  return `${formatted} ${suffix}`;
}

/**
 * Apple-style ROI calculator — canvas inputs left, dark tile result right.
 * Tabular numerals on every figure, single coral accent on slider thumb.
 */
export function RoiCalculator() {
  const t = useTranslations('roi_calculator');
  const locale = useLocale() as LocaleKey;

  const [monthlyOrders, setMonthlyOrders] = useState(1500);
  const [avgOrder, setAvgOrder] = useState(80000);
  const [staffCount, setStaffCount] = useState(8);

  const monthlyRevenue = monthlyOrders * avgOrder;
  const orderErrorLoss = monthlyRevenue * 0.08;
  const staffTimeLoss = staffCount * 600_000;
  const missedOnlineOrders = monthlyRevenue * 0.15;
  const totalMonthlyLoss = orderErrorLoss + staffTimeLoss + missedOnlineOrders;

  const myposCost = 250_000;
  const monthlySavings = totalMonthlyLoss - myposCost;
  const annualSavings = monthlySavings * 12;
  const roiPercent = Math.round((monthlySavings / myposCost) * 100);
  const paybackDays = Math.round((myposCost / monthlySavings) * 30) || 1;

  return (
    <section id="roi" className="bg-canvas">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto mb-xxl max-w-3xl text-center">
          <p className="text-tagline text-coral font-display">{t('label')}</p>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-xl text-lead text-ink font-display">
            {t('subtitle')}
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mx-auto grid max-w-6xl gap-md lg:grid-cols-2">
            {/* INPUT panel — light parchment */}
            <div className="rounded-card bg-parchment p-xl shadow-hairline-ring">
              <h3 className="mb-lg text-tagline text-ink font-display font-semibold">
                {t('inputs_title')}
              </h3>

              <div className="space-y-xl">
                <SliderRow
                  id="roi-orders"
                  label={t('orders_label')}
                  value={monthlyOrders.toLocaleString('en-US').replace(/,/g, ' ')}
                  min={100}
                  max={10000}
                  step={100}
                  current={monthlyOrders}
                  onChange={setMonthlyOrders}
                  minLabel="100"
                  maxLabel="10 000"
                />
                <SliderRow
                  id="roi-avg"
                  label={t('avg_order_label')}
                  value={formatUZS(avgOrder, locale)}
                  min={20000}
                  max={500000}
                  step={5000}
                  current={avgOrder}
                  onChange={setAvgOrder}
                  minLabel="20k"
                  maxLabel="500k"
                />
                <SliderRow
                  id="roi-staff"
                  label={t('staff_label')}
                  value={String(staffCount)}
                  min={1}
                  max={50}
                  step={1}
                  current={staffCount}
                  onChange={setStaffCount}
                  minLabel="1"
                  maxLabel="50"
                />

                <div className="rounded-card bg-canvas p-md">
                  <p className="text-caption-strong text-ink-muted-48 font-display">
                    {t('current_revenue')}
                  </p>
                  <p className="tabular mt-xxs text-display-md text-ink font-display font-semibold">
                    {formatUZS(monthlyRevenue, locale)}
                  </p>
                  <p className="mt-xxs text-fine-print text-ink-muted-48">{t('per_month')}</p>
                </div>
              </div>
            </div>

            {/* OUTPUT panel — dark tile */}
            <motion.div
              key={`${monthlyOrders}-${avgOrder}-${staffCount}`}
              initial={{ opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-card bg-tile-dark-1 p-xl text-on-dark"
            >
              <h3 className="mb-lg text-tagline text-on-dark font-display font-semibold">
                {t('savings_title')}
              </h3>

              <div className="mb-xl">
                <p className="text-caption-strong text-on-dark-muted font-display">
                  {t('annual_savings_label')}
                </p>
                <p className="tabular mt-xs text-hero-display text-on-dark font-display font-semibold">
                  {formatUZS(Math.max(0, annualSavings), locale)}
                </p>
                <p className="mt-xxs text-caption text-on-dark-muted">{t('per_year')}</p>
              </div>

              <div className="mb-md grid grid-cols-2 gap-xs">
                <Stat
                  icon={Coins}
                  value={formatUZS(Math.max(0, monthlySavings), locale)}
                  label={t('monthly_savings')}
                />
                <Stat
                  icon={TrendUp}
                  value={`${Math.max(0, roiPercent)}%`}
                  label={t('roi_label')}
                />
                <Stat
                  icon={Clock}
                  value={`${paybackDays > 365 ? '12+' : paybackDays} ${paybackDays > 365 ? t('months') : t('days')}`}
                  label={t('payback_label')}
                />
                <Stat
                  icon={CheckCircle}
                  value={formatUZS(myposCost, locale)}
                  label={t('mypos_cost')}
                />
              </div>

              <p className="text-fine-print italic text-on-dark-muted">{t('disclaimer')}</p>

              <a
                href={`/${locale}/demo`}
                className="mt-lg inline-flex h-12 w-full items-center justify-center rounded-pill bg-tenant px-lg text-body text-tenant-on-primary transition-transform duration-fast active:scale-95"
              >
                {t('cta')}
              </a>
            </motion.div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  minLabel,
  maxLabel,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (n: number) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div>
      <div className="mb-xxs flex items-center justify-between">
        <label htmlFor={id} className="text-caption-strong text-ink-muted-80 font-display">
          {label}
        </label>
        <span className="tabular text-tagline text-coral font-display font-semibold">
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-pill bg-hairline-soft accent-coral"
      />
      <div className="mt-xxs flex justify-between text-fine-print text-ink-muted-48">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function Stat({
  icon: IconComp,
  value,
  label,
}: {
  icon: Icon;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-card bg-tile-dark-2 p-md">
      <IconComp size={20} weight="light" className="mb-xs text-on-dark-muted" aria-hidden="true" />
      <p className="tabular text-tagline text-on-dark font-display font-semibold">{value}</p>
      <p className="mt-xxs text-fine-print text-on-dark-muted">{label}</p>
    </div>
  );
}
