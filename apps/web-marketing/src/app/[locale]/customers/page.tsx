import type { Icon } from '@phosphor-icons/react';
import {
  BowlFood,
  Clock,
  Coffee,
  Pizza,
  TrendUp,
  Users,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = {
  params: Promise<{ locale: string }>;
};

type StoryConfig = {
  id: string;
  CardIcon: Icon;
  metricIcon: Icon;
  bg: string;
};

type Stat = { value: string; label: string };
type Section = { heading: string; text: string };

const STORIES: readonly StoryConfig[] = [
  { id: 'osh-markazi', CardIcon: BowlFood, metricIcon: TrendUp, bg: 'bg-parchment' },
  { id: 'pizza-house', CardIcon: Pizza, metricIcon: Clock, bg: 'bg-coral-tint' },
  { id: 'cafe-aroma', CardIcon: Coffee, metricIcon: Users, bg: 'bg-parchment' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'customers_page' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function CustomersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'customers_page' });

  return (
    <main>
      <section className="bg-parchment pb-section-tight pt-[128px] lg:pt-[160px]">
        <div className="mx-auto max-w-7xl px-md text-center">
          <p className="font-display font-semibold text-tagline uppercase tracking-wider text-coral">
            {t('label')}
          </p>
          <h1 className="mt-md font-display font-semibold text-hero-display text-ink">
            {t('title')}
          </h1>
          <p className="mx-auto mt-md max-w-2xl font-display text-lead text-ink-muted-80">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <section className="bg-canvas py-section">
        <div className="mx-auto max-w-5xl space-y-[80px] px-md">
          {STORIES.map((story, i) => {
            const CardIcon = story.CardIcon;
            const MetricIcon = story.metricIcon;
            const key = `case${i + 1}` as const;
            const stats = t.raw(`${key}.stats`) as Stat[];
            const sections = t.raw(`${key}.sections`) as Section[];

            return (
              <article id={story.id} key={story.id} className="scroll-mt-24">
                <div
                  className={`${story.bg} mb-md flex flex-col items-center gap-xl rounded-card p-xl md:flex-row`}
                >
                  <CardIcon
                    size={120}
                    weight="thin"
                    className="text-ink-muted-48"
                    aria-hidden="true"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="font-display font-semibold text-display-sm text-ink">
                      {t(`${key}.name`)}
                    </h2>
                    <p className="mt-xs text-body text-ink-muted-80">
                      {t(`${key}.location`)} • {t(`${key}.cuisine`)}
                    </p>
                    <p className="mt-md text-body text-ink-muted-80 italic">
                      &ldquo;{t(`${key}.quote`)}&rdquo;
                    </p>
                    <p className="mt-xs font-semibold text-caption text-ink-muted-48">
                      — {t(`${key}.author`)}
                    </p>
                  </div>
                </div>

                <div className="mb-md grid gap-sm sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-card border border-hairline-soft bg-canvas p-lg text-center"
                    >
                      <MetricIcon
                        size={32}
                        weight="light"
                        aria-hidden="true"
                        className="mx-auto mb-sm text-coral"
                      />
                      <p className="tabular font-display font-semibold text-display-sm text-ink">
                        {stat.value}
                      </p>
                      <p className="mt-xxs text-caption text-ink-muted-80">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-md">
                  {sections.map((section) => (
                    <div key={section.heading}>
                      <h3 className="font-display font-semibold text-title text-ink">
                        {section.heading}
                      </h3>
                      <p className="mt-xs text-body text-ink-muted-80 leading-relaxed">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
