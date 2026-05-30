import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  BowlFood,
  ChartLineUp,
  Clock,
  Coffee,
  MapPin,
  Pizza,
  Quotes,
  Star,
  TrendUp,
  Users,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = {
  params: Promise<{ locale: string }>;
};

type StoryConfig = {
  id: string;
  CardIcon: Icon;
  metricIcon: Icon;
  /** Tailwind hue for the cover icon-box. */
  tint: string;
  bg: string;
};

type Stat = { value: string; label: string };
type Section = { heading: string; text: string };

const STORIES: readonly StoryConfig[] = [
  { id: 'osh-markazi', CardIcon: BowlFood, metricIcon: TrendUp,      tint: 'text-amber-400',   bg: 'bg-amber-500/15' },
  { id: 'pizza-house', CardIcon: Pizza,    metricIcon: Clock,        tint: 'text-[#ff0037]',   bg: 'bg-[rgba(255,0,55,0.15)]' },
  { id: 'cafe-aroma',  CardIcon: Coffee,   metricIcon: Users,        tint: 'text-purple-400',  bg: 'bg-purple-500/15' },
];

const OVERALL_STATS = [
  { value: '500+', label: 'restoran ishonadi' },
  { value: '1M+',  label: 'oylik buyurtma' },
  { value: '98%',  label: 'mijozlar mamnun' },
  { value: '40+',  label: 'brend hamkor' },
] as const;

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        />
        <div className="relative mx-auto max-w-5xl px-5 pt-20 sm:pt-24 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Star size={11} weight="fill" />
            {t('label')}
          </span>
          <h1 className="mt-5 mx-auto max-w-3xl text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            {t('subtitle')}
          </p>

          {/* Overall stats — small chip row */}
          <div className="glass-card mx-auto mt-10 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {OVERALL_STATS.map((s) => (
              <div
                key={s.label}
                className="px-3 py-4 text-center bg-white/[0.02]"
              >
                <div className="tabular text-[22px] sm:text-[24px] font-extrabold leading-none text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-[10.5px] sm:text-[11px] font-semibold text-white/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer success stories */}
      <section className="bg-[#001B1B] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 space-y-12">
          {STORIES.map((story, i) => {
            const CardIcon = story.CardIcon;
            const MetricIcon = story.metricIcon;
            const key = `case${i + 1}` as const;
            const stats = t.raw(`${key}.stats`) as Stat[];
            const sections = t.raw(`${key}.sections`) as Section[];

            return (
              <article id={story.id} key={story.id} className="glass-card rounded-2xl overflow-hidden scroll-mt-24">
                {/* Cover header */}
                <header className="flex flex-col items-start gap-5 p-6 sm:p-8 sm:flex-row sm:items-center">
                  <div
                    className={`flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/10 ${story.bg}`}
                  >
                    <CardIcon
                      size={36}
                      weight="duotone"
                      className={story.tint}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[22px] sm:text-[28px] font-extrabold tracking-tight text-white">
                      {t(`${key}.name`)}
                    </h2>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-white/60">
                      <MapPin size={11} weight="bold" className="text-[#14b8a6]" />
                      {t(`${key}.location`)}
                      <span className="text-white/30 px-1">·</span>
                      {t(`${key}.cuisine`)}
                    </p>
                  </div>
                  <div className="flex gap-0.5 sm:self-start" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} size={13} weight="fill" className="text-amber-400" />
                    ))}
                  </div>
                </header>

                {/* Quote */}
                <div className="relative px-6 sm:px-8 pb-6 sm:pb-8">
                  <Quotes
                    size={32}
                    weight="fill"
                    className="absolute top-0 left-6 sm:left-8 text-[#14b8a6]/20"
                    aria-hidden="true"
                  />
                  <p className="pt-7 text-[15px] sm:text-[16px] leading-relaxed text-white/90 italic">
                    &ldquo;{t(`${key}.quote`)}&rdquo;
                  </p>
                  <p className="mt-3 text-[12px] font-bold text-[#5eead4]">
                    — {t(`${key}.author`)}
                  </p>
                </div>

                {/* Stats — inline grid inside the card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.06] border-y border-white/[0.06]">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[rgba(0,27,27,0.40)] backdrop-blur-sm p-5 text-center"
                    >
                      <MetricIcon
                        size={20}
                        weight="bold"
                        className="mx-auto mb-2 text-[#ff0037]"
                        aria-hidden="true"
                      />
                      <p className="tabular text-[26px] sm:text-[28px] font-extrabold leading-none text-white">
                        {stat.value}
                      </p>
                      <p className="mt-1.5 text-[11.5px] font-semibold text-white/60">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Story body sections */}
                <div className="p-6 sm:p-8 space-y-5">
                  {sections.map((section) => (
                    <div key={section.heading}>
                      <h3 className="text-[15px] font-bold tracking-tight text-white">
                        {section.heading}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}

          {/* "Become a customer" inline banner */}
          <div className="glass-card rounded-2xl px-6 sm:px-10 py-8 sm:py-10 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)] mb-4">
              <ChartLineUp size={22} weight="bold" className="text-[#ff0037]" />
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight text-white">
              500+ restoran qatoriga qo&apos;shilamizmi?
            </h3>
            <p className="mt-2 mx-auto max-w-[32rem] text-[13.5px] text-white/70">
              Birinchi 14 kun bepul. Kredit karta kerak emas. 30 daqiqada ulaymiz.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/get-started`}
                className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
              >
                Bepul boshlash
                <ArrowRight size={13} weight="bold" />
              </Link>
              <Link
                href={`/${locale}/demo`}
                className="press inline-flex h-10 items-center px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                Demo so&apos;rash
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
