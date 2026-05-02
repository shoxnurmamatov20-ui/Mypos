import { Calendar, Clock, Globe, Headphones } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DemoForm } from '@/components/landing/demo-form';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'demo_page' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const PERKS = [
  { icon: Calendar, key: 'perk_personalized' },
  { icon: Clock, key: 'perk_30min' },
  { icon: Globe, key: 'perk_remote' },
  { icon: Headphones, key: 'perk_questions' },
] as const;

export default async function DemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('demo_page');

  return (
    <main className="pb-section pt-[128px]">
      <div className="mx-auto max-w-7xl px-md">
        <div className="grid gap-xl lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display font-semibold text-tagline uppercase tracking-wider text-coral">
              {t('label')}
            </p>
            <h1 className="mt-md font-display font-semibold text-display-md text-ink">
              {t('title')}
            </h1>
            <p className="mt-md font-display text-lead text-ink-muted-80">{t('subtitle')}</p>

            <div className="mt-xl space-y-md">
              {PERKS.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-start gap-md">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-coral-tint text-coral">
                    <Icon size={24} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-body-strong text-ink">
                      {t(`${key}_title`)}
                    </h3>
                    <p className="mt-xxs text-caption text-ink-muted-80">{t(`${key}_desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <DemoForm locale={locale} />
          </div>
        </div>
      </div>
    </main>
  );
}
