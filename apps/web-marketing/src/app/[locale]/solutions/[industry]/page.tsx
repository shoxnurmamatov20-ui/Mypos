import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { routing } from '@/i18n/routing';

const VALID_INDUSTRIES = ['cafe', 'restaurant', 'fastfood', 'bar'] as const;
type Industry = (typeof VALID_INDUSTRIES)[number];

type SolutionItem = { title: string; desc: string };

type Props = {
  params: Promise<{ locale: string; industry: string }>;
};

function isIndustry(value: string): value is Industry {
  return (VALID_INDUSTRIES as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    VALID_INDUSTRIES.map((industry) => ({ locale, industry })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, industry } = await params;
  if (!isIndustry(industry)) return {};

  const t = await getTranslations({ locale, namespace: 'solutions_page' });
  return {
    title: t(`${industry}_meta_title`),
    description: t(`${industry}_meta_description`),
  };
}

export default async function SolutionPage({ params }: Props) {
  const { locale, industry } = await params;

  if (!isIndustry(industry)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'solutions_page' });
  const industryKey: Industry = industry;

  const pains = t.raw(`${industryKey}_pains`) as string[];
  const solutions = t.raw(`${industryKey}_solutions`) as SolutionItem[];

  return (
    <main>
      <section className="bg-parchment pb-section pt-[128px] lg:pt-[160px]">
        <div className="mx-auto max-w-7xl px-md">
          <div className="max-w-3xl">
            <p className="font-display font-semibold text-tagline uppercase tracking-wider text-coral">
              {t('label')}
            </p>
            <h1 className="mt-md font-display font-semibold text-hero-display text-ink">
              {t(`${industryKey}_h1`)}
            </h1>
            <p className="mt-md font-display text-lead text-ink-muted-80">
              {t(`${industryKey}_lead`)}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-canvas py-section">
        <div className="mx-auto max-w-7xl px-md">
          <h2 className="mb-xl text-center font-display font-semibold text-display-sm text-ink">
            {t('pain_title')}
          </h2>
          <div className="grid gap-md md:grid-cols-3">
            {pains.map((pain) => (
              <div
                key={pain}
                className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring"
              >
                <span aria-hidden="true" className="text-3xl">
                  ⚠️
                </span>
                <p className="mt-sm text-body font-semibold text-ink-muted-80">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-parchment py-section">
        <div className="mx-auto max-w-7xl px-md">
          <h2 className="mb-xl text-center font-display font-semibold text-display-sm text-ink">
            {t('solutions_title')}
          </h2>
          <div className="grid gap-md md:grid-cols-2">
            {solutions.map((sol) => (
              <div
                key={sol.title}
                className="rounded-card border border-hairline-soft bg-canvas p-lg transition-transform duration-fast hover:shadow-hairline-ring"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-pearl bg-success-soft text-success-text"
                >
                  ✓
                </span>
                <h3 className="mt-sm font-display font-semibold text-title text-ink">
                  {sol.title}
                </h3>
                <p className="mt-xs text-caption text-ink-muted-80">{sol.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
