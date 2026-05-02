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
      <section className="bg-parchment py-section">
        <div className="mx-auto max-w-3xl px-md text-center">
          <h1 className="font-display font-semibold text-display-md text-ink">{t('title')}</h1>
          <p className="mt-md font-display text-lead text-ink-muted-80">{t('subtitle')}</p>
        </div>
      </section>

      <section className="bg-canvas py-section">
        <div className="mx-auto grid max-w-6xl gap-md px-md md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-pearl bg-coral-tint text-coral">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mt-md font-display font-semibold text-title text-ink">
                  {card.title}
                </h2>
                <p className="mt-xs text-caption text-ink-muted-80 leading-relaxed">{card.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
