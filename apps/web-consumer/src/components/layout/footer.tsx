'use client';

import { Facebook, Instagram, Mail, MapPin, Phone, Send, Youtube } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { Newsletter } from './newsletter';

type FooterLink = {
  label: string;
  href: Route | string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const MARKETING_BASE = 'https://mypos.uz';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  const phoneRaw = t('phone').replace(/\s/g, '');

  const columns: FooterColumn[] = [
    {
      title: t('section_product'),
      links: [
        { label: t('link_restaurants'), href: `/${locale}/restaurants` as Route },
        { label: t('link_search'), href: `/${locale}/search` as Route },
        { label: t('link_orders'), href: `/${locale}/orders` as Route },
        { label: t('link_loyalty'), href: `/${locale}/profile/loyalty` as Route },
      ],
    },
    {
      title: t('section_company'),
      links: [
        { label: t('link_about'), href: `${MARKETING_BASE}/${locale}/about`, external: true },
        { label: t('link_blog'), href: `${MARKETING_BASE}/${locale}/blog`, external: true },
        { label: t('link_career'), href: `${MARKETING_BASE}/${locale}/about`, external: true },
        { label: t('link_press'), href: `${MARKETING_BASE}/${locale}/contact`, external: true },
      ],
    },
    {
      title: t('section_help'),
      links: [
        { label: t('link_help_center'), href: `/${locale}/profile/help` as Route },
        { label: t('link_contact'), href: `${MARKETING_BASE}/${locale}/contact`, external: true },
        { label: t('link_faq'), href: `${MARKETING_BASE}/${locale}/contact`, external: true },
      ],
    },
    {
      title: t('section_legal'),
      links: [
        { label: t('link_terms'), href: `${MARKETING_BASE}/${locale}/about`, external: true },
        { label: t('link_privacy'), href: `${MARKETING_BASE}/${locale}/about`, external: true },
        { label: t('link_cookies'), href: `${MARKETING_BASE}/${locale}/about`, external: true },
      ],
    },
  ];

  const socials: { label: string; href: string; icon: React.ElementType }[] = [
    { label: t('social_telegram'), href: 'https://t.me/mypos_uz', icon: Send },
    { label: t('social_instagram'), href: 'https://instagram.com/mypos.uz', icon: Instagram },
    { label: t('social_facebook'), href: 'https://facebook.com/mypos.uz', icon: Facebook },
    { label: t('social_youtube'), href: 'https://youtube.com/@mypos', icon: Youtube },
  ];

  return (
    <footer className="mt-auto bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2">
            <Link
              href={`/${locale}` as Route}
              className="inline-flex items-center gap-2"
              aria-label="MyPOS"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
                <span className="text-xl" aria-hidden="true">
                  🍽️
                </span>
              </span>
              <span className="font-display text-3xl font-extrabold text-white">MyPOS</span>
            </Link>

            <p className="mt-3 max-w-md text-base text-neutral-400">{t('tagline')}</p>

            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a href={`tel:${phoneRaw}`} className="transition hover:text-white">
                  {t('phone')}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a href={`mailto:${t('email')}`} className="transition hover:text-white">
                  {t('email')}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span>{t('address')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Send className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a
                  href="https://t.me/mypos_support"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition hover:text-white"
                >
                  Telegram: {t('telegram_handle')}
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <Newsletter />
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-2">
              {socials.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 transition hover:bg-brand-500 hover:text-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3">
            {columns.map((column) => (
              <FooterColumnView key={column.title} column={column} />
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-neutral-800 pt-8 text-xs text-neutral-500 sm:flex-row sm:items-center">
          <span>{t('copyright')}</span>
          <div className="flex items-center gap-4">
            <span>{t('made_with')}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumnView({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
        {column.title}
      </h4>
      <ul className="mt-3 space-y-2">
        {column.links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href as string}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href as Route}
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
