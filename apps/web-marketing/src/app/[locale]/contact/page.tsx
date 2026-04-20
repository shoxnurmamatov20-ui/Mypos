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
      <section className="bg-gradient-to-br from-brand-50 via-white to-mint-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">{t('subtitle')}</p>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[3fr_2fr] lg:gap-14 lg:px-8">
          <ContactForm />
          <aside>
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              {t('channels_title')}
            </h2>
            <ul className="mt-6 space-y-4">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <li
                    key={channel.label}
                    className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4"
                  >
                    <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {channel.label}
                      </div>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          target={channel.href.startsWith('http') ? '_blank' : undefined}
                          rel={channel.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                          className="text-sm font-medium text-neutral-900 hover:text-brand-700"
                        >
                          {channel.value}
                        </a>
                      ) : (
                        <div className="text-sm font-medium text-neutral-900">{channel.value}</div>
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
