import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/landing/contact-form';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact_page' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact_page' });
  const tFooter = await getTranslations({ locale, namespace: 'footer' });

  const channels: { icon: LucideIcon; label: string; value: string; href?: string }[] = [
    { icon: Phone, label: t('channels.phone'), value: tFooter('phone'), href: `tel:${tFooter('phone').replace(/\s/g, '')}` },
    { icon: Mail, label: t('channels.email'), value: tFooter('email'), href: `mailto:${tFooter('email')}` },
    { icon: MessageCircle, label: t('channels.telegram'), value: '@mypos_uz', href: 'https://t.me/mypos_uz' },
    { icon: MapPin, label: t('channels.address'), value: tFooter('address') },
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
        <div className="mx-auto grid max-w-6xl gap-xl px-md lg:grid-cols-[3fr_2fr]">
          <ContactForm />
          <aside>
            <h2 className="font-display font-semibold text-title text-ink">
              {t('channels_title')}
            </h2>
            <ul className="mt-md space-y-sm">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <li
                    key={channel.label}
                    className="flex items-start gap-sm rounded-pearl border border-hairline-soft bg-canvas p-sm"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pearl bg-coral-tint text-coral">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="text-fine-print font-display font-semibold uppercase tracking-wider text-ink-muted-48">
                        {channel.label}
                      </div>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          target={channel.href.startsWith('http') ? '_blank' : undefined}
                          rel={channel.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                          className="text-caption font-semibold text-ink transition-colors duration-fast hover:text-coral"
                        >
                          {channel.value}
                        </a>
                      ) : (
                        <div className="text-caption font-semibold text-ink">{channel.value}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
