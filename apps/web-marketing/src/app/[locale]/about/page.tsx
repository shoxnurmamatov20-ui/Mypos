import { Heart, Rocket, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about_page' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about_page' });

  const cards = [
    { icon: Rocket, title: t('mission_title'), body: t('mission') },
    { icon: Heart, title: t('vision_title'), body: t('vision') },
    { icon: Users, title: t('team_title'), body: t('team') },
  ];

  return (
    <>
      <section className="bg-gradient-to-br from-brand-50 via-white to-mint-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">{t('subtitle')}</p>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold text-neutral-900">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{card.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
