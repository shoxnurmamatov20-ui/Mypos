'use client';

import {
  ArrowRight,
  BowlFood,
  Clock,
  Coffee,
  type Icon,
  Pizza,
  TrendUp,
  Users,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FadeUp, StaggerGroup, StaggerItem } from './animations';

type CaseConfig = {
  id: string;
  CardIcon: Icon;
  MetricIcon: Icon;
  metricValueKey: string;
  metricLabelKey: string;
};

const CASES: readonly CaseConfig[] = [
  {
    id: 'osh-markazi',
    CardIcon: BowlFood,
    MetricIcon: TrendUp,
    metricValueKey: 'case1_metric_value',
    metricLabelKey: 'case1_metric_label',
  },
  {
    id: 'pizza-house',
    CardIcon: Pizza,
    MetricIcon: Clock,
    metricValueKey: 'case2_metric_value',
    metricLabelKey: 'case2_metric_label',
  },
  {
    id: 'cafe-aroma',
    CardIcon: Coffee,
    MetricIcon: Users,
    metricValueKey: 'case3_metric_value',
    metricLabelKey: 'case3_metric_label',
  },
];

export function CaseStudies() {
  const t = useTranslations('case_studies');
  const locale = useLocale();

  return (
    <section id="case-studies" className="bg-parchment">
      <div className="mx-auto max-w-7xl px-md py-section sm:px-lg lg:px-xl">
        <FadeUp className="mx-auto mb-xxl max-w-3xl text-center">
          <p className="text-tagline text-coral font-display">{t('label')}</p>
          <h2 className="mt-sm text-display-lg text-ink font-display font-semibold">
            {t('title')}
          </h2>
          <p className="mx-auto mt-md max-w-[36rem] text-lead text-ink font-display">
            {t('subtitle')}
          </p>
        </FadeUp>

        <StaggerGroup className="mb-xl grid gap-md md:grid-cols-3">
          {CASES.map((caseStudy, i) => {
            const MetricIcon = caseStudy.MetricIcon;
            const CardIcon = caseStudy.CardIcon;
            const caseKey = `case${i + 1}` as const;

            return (
              <StaggerItem key={caseStudy.id}>
                <Link
                  href={`/${locale}/customers#${caseStudy.id}` as never}
                  className="group flex h-full flex-col overflow-hidden rounded-card bg-canvas shadow-hairline-ring transition-transform duration-fast active:scale-95"
                >
                  <div className="flex items-center justify-center bg-pearl p-xl">
                    <CardIcon
                      weight="thin"
                      size={80}
                      className="text-ink-muted-48"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-lg">
                    <div className="mb-md flex items-center gap-xs border-b border-hairline-soft pb-md">
                      <div className="flex h-12 w-12 items-center justify-center rounded-pearl bg-coral-tint">
                        <MetricIcon
                          size={24}
                          weight="light"
                          aria-hidden="true"
                          className="text-coral"
                        />
                      </div>
                      <div>
                        <p className="tabular text-display-md text-ink font-display font-semibold">
                          {t(caseStudy.metricValueKey)}
                        </p>
                        <p className="text-fine-print text-ink-muted-48">
                          {t(caseStudy.metricLabelKey)}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-tagline text-ink font-display font-semibold">
                      {t(`${caseKey}_name`)}
                    </h3>
                    <p className="mt-xs flex-1 text-body text-ink-muted-80">
                      {t(`${caseKey}_excerpt`)}
                    </p>

                    <div className="mt-md inline-flex items-center gap-xxs text-caption-strong text-coral font-display">
                      {t('read_story')}
                      <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        <FadeUp delay={0.2} className="text-center">
          <Link
            href={`/${locale}/customers` as never}
            className="inline-flex h-12 items-center gap-xs rounded-pill bg-pearl px-lg text-body text-ink shadow-hairline-ring transition-transform duration-fast active:scale-95"
          >
            {t('view_all')}
            <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
