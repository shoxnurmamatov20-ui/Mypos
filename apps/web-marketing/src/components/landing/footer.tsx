import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const year = new Date().getFullYear();

  const groups = [
    {
      title: t('product'),
      links: [
        { label: t('features'), href: `/${locale}/features` },
        { label: t('pricing'), href: `/${locale}/pricing` },
        { label: t('integrations'), href: `/${locale}/features` },
        { label: t('mobile_apps'), href: `/${locale}/features` },
      ],
    },
    {
      title: t('company'),
      links: [
        { label: t('about'), href: `/${locale}/about` },
        { label: t('blog'), href: `/${locale}/blog` },
        { label: t('careers'), href: `/${locale}/about` },
        { label: t('partners'), href: `/${locale}/contact` },
      ],
    },
    {
      title: t('support'),
      links: [
        { label: t('contact'), href: `/${locale}/contact` },
        { label: t('docs'), href: `/${locale}/contact` },
        { label: t('status'), href: `/${locale}/contact` },
        { label: t('contact_sales'), href: `/${locale}/contact` },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('privacy'), href: `/${locale}/about` },
        { label: t('terms'), href: `/${locale}/about` },
      ],
    },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50/80">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Logo locale={locale} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600">
              {t('tagline')}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-500" aria-hidden="true" />
                <a href={`tel:${t('phone').replace(/\s/g, '')}`} className="hover:text-brand-700">
                  {t('phone')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-500" aria-hidden="true" />
                <a href={`mailto:${t('email')}`} className="hover:text-brand-700">
                  {t('email')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" aria-hidden="true" />
                <span>{t('address')}</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-brand-500" aria-hidden="true" />
                <a
                  href="https://t.me/mypos_uz"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-brand-700"
                >
                  @mypos_uz
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <div className="font-display text-sm font-semibold text-neutral-900">
                  {group.title}
                </div>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-600 transition hover:text-brand-700"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center">
          <span>
            &copy; {t('copyright', { year: String(year) })}
          </span>
          <LanguageSwitcher align="left" />
        </div>
      </div>
    </footer>
  );
}
