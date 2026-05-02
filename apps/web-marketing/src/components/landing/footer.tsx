import { Envelope, MapPin, Phone, TelegramLogo } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';
import { Newsletter } from './newsletter';

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
    <footer className="border-t border-black/[0.06] bg-[#F7FAF7]">
      <div className="mx-auto max-w-7xl px-md py-section-tight sm:px-lg lg:px-xl">
        <div className="grid gap-xl lg:grid-cols-[1.1fr_2fr] lg:gap-xxl">
          <div>
            <Logo locale={locale} />
            <p className="mt-md max-w-sm text-caption text-ink-muted-80">{t('tagline')}</p>

            <ul className="mt-lg space-y-xs text-caption text-ink-muted-80">
              <li className="flex items-center gap-xs">
                <Phone size={16} weight="duotone" className="text-coral" aria-hidden="true" />
                <a href={`tel:${t('phone').replace(/\s/g, '')}`} className="hover:text-coral">
                  {t('phone')}
                </a>
              </li>
              <li className="flex items-center gap-xs">
                <Envelope size={16} weight="duotone" className="text-coral" aria-hidden="true" />
                <a href={`mailto:${t('email')}`} className="hover:text-coral">
                  {t('email')}
                </a>
              </li>
              <li className="flex items-center gap-xs">
                <MapPin size={16} weight="duotone" className="text-coral" aria-hidden="true" />
                <span>{t('address')}</span>
              </li>
              <li className="flex items-center gap-xs">
                <TelegramLogo size={16} weight="fill" className="text-coral" aria-hidden="true" />
                <a
                  href="https://t.me/mypos_uz"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-coral"
                >
                  @mypos_uz
                </a>
              </li>
            </ul>

            <div className="mt-lg max-w-sm">
              <Newsletter />
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-md sm:grid-cols-4">
            {groups.map((group) => (
              <div
                key={group.title}
                className="rounded-card border border-black/[0.06] bg-white p-md"
              >
                <div className="font-display text-caption-strong text-ink">{group.title}</div>
                <ul className="mt-sm space-y-xs">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-body text-ink-muted-80 transition-colors duration-fast hover:text-coral"
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

        <div className="mt-xl flex flex-col items-start justify-between gap-md border-t border-black/[0.06] pt-md text-fine-print text-ink-muted-48 sm:flex-row sm:items-center">
          <span>&copy; {t('copyright', { year: String(year) })}</span>
          <LanguageSwitcher align="left" />
        </div>
      </div>
    </footer>
  );
}
