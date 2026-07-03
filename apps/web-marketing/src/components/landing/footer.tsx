'use client';

import {
  ArrowRight,
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
  TelegramLogo,
  YoutubeLogo,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';

/**
 * Social platforms with their authentic brand colours — hover lifts each
 * chip into its real brand identity (Telegram blue, YouTube red, etc.).
 */
const SOCIAL = [
  {
    Icon: TelegramLogo,
    href: 'https://t.me/mypos_uz',
    label: 'Telegram',
    hover: 'hover:text-[#26A5E4] hover:border-[#26A5E4]/40',
  },
  {
    Icon: InstagramLogo,
    href: 'https://instagram.com/mypos.uz',
    label: 'Instagram',
    hover: 'hover:text-[#E4405F] hover:border-[#E4405F]/40',
  },
  {
    Icon: YoutubeLogo,
    href: 'https://youtube.com/@mypos',
    label: 'YouTube',
    hover: 'hover:text-[#FF0000] hover:border-[#FF0000]/40',
  },
  {
    Icon: LinkedinLogo,
    href: 'https://linkedin.com/company/mypos',
    label: 'LinkedIn',
    hover: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/40',
  },
  {
    Icon: FacebookLogo,
    href: 'https://facebook.com/mypos.uz',
    label: 'Facebook',
    hover: 'hover:text-[#1877F2] hover:border-[#1877F2]/40',
  },
] as const;

/**
 * Compact footer — inline newsletter row, 3-column link grid, single-line
 * legal bottom bar. Social chips hover into their real brand colours.
 */
export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
    }, 2500);
  };

  const sections: ReadonlyArray<{
    title: string;
    links: ReadonlyArray<{ label: string; href: string; external?: boolean; badge?: string }>;
  }> = [
    {
      title: t('product'),
      links: [
        { label: t('features'), href: `/${locale}/features` },
        { label: t('pricing'), href: `/${locale}/pricing` },
        { label: 'Yechimlar', href: `/${locale}/solutions` },
        { label: t('integrations'), href: `/${locale}/integrations` },
        { label: 'API', href: `/${locale}/api` },
        { label: 'Demo', href: `/${locale}/demo` },
      ],
    },
    {
      title: 'Resurslar',
      links: [
        { label: 'Hujjatlar', href: `/${locale}/docs` },
        { label: 'FAQ', href: `/${locale}/faq` },
        { label: 'Changelog', href: `/${locale}/changelog`, badge: 'Yangi' },
        { label: 'Mijozlar', href: `/${locale}/customers` },
        { label: t('blog'), href: `/${locale}/blog` },
        { label: t('status'), href: 'https://status.mypos.uz', external: true },
      ],
    },
    {
      title: t('company'),
      links: [
        { label: t('about'), href: `/${locale}/about` },
        { label: t('careers'), href: `/${locale}/careers` },
        { label: t('contact'), href: `/${locale}/contact` },
        { label: 'Bepul boshlash', href: `/${locale}/get-started`, badge: 'Bepul' },
      ],
    },
    {
      title: 'Huquqiy',
      links: [
        { label: t('privacy'), href: `/${locale}/privacy` },
        { label: t('terms'), href: `/${locale}/terms` },
        { label: 'Cookies', href: `/${locale}/cookies` },
        { label: 'Xavfsizlik', href: `/${locale}/security` },
      ],
    },
  ];

  return (
    <footer className="bg-[#001B1B]">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Compact newsletter row */}
        <div className="glass-card flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white">
              Yangilanishlardan boxabar bo&apos;ling
            </h3>
            <p className="text-[12px] text-white/60 mt-0.5">Oyiga 1 ta xat · Spam yo&apos;q</p>
          </div>
          <form onSubmit={onSubmit} className="flex gap-2 w-full sm:w-auto sm:max-w-[24rem]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@kompaniya.uz"
              aria-label="Email"
              className="flex-1 h-9 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13px] placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              disabled={submitted}
              className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12px] font-bold transition-colors disabled:opacity-80"
            >
              {submitted ? '✓' : 'Obuna'}
              {submitted ? null : <ArrowRight size={11} weight="bold" />}
            </button>
          </form>
        </div>

        {/* Brand + 4 link columns */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand col */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo />
            <p className="mt-3 text-[12.5px] leading-relaxed text-white/60">{t('tagline')}</p>
            <ul className="mt-4 space-y-1.5 text-[12px] text-white/60">
              <li className="flex items-center gap-1.5">
                <MapPin size={11} weight="bold" className="shrink-0 text-[#14b8a6]" />
                Toshkent, O&apos;zbekiston
              </li>
              <li>
                <a
                  href={`tel:${t('phone').replace(/\s|-/g, '')}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#5eead4] transition-colors"
                >
                  <Phone size={11} weight="bold" className="shrink-0" />
                  {t('phone')}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${t('email')}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#5eead4] transition-colors break-all"
                >
                  <EnvelopeSimple size={11} weight="bold" className="shrink-0" />
                  {t('email')}
                </a>
              </li>
            </ul>
            {/* Social chips — real brand colours on hover */}
            <div className="mt-4 flex items-center gap-1.5">
              {SOCIAL.map(({ Icon, href, label, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={`press flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-white/70 transition-colors ${hover}`}
                >
                  <Icon size={15} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                {section.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => {
                  const badgeEl = link.badge ? (
                    <span
                      className={`inline-flex items-center px-1.5 py-px rounded-full text-[8.5px] font-bold uppercase tracking-[0.06em] ${
                        link.badge === 'Bepul'
                          ? 'bg-[#ff0037] text-white'
                          : 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/25 text-emerald-300'
                      }`}
                    >
                      {link.badge}
                    </span>
                  ) : null;
                  return (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12.5px] text-white/60 hover:text-[#5eead4] transition-colors"
                        >
                          {link.label} ↗{badgeEl}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1.5 text-[12.5px] text-white/60 hover:text-[#5eead4] transition-colors"
                        >
                          {link.label}
                          {badgeEl}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar — single line */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
          <div className="flex items-center gap-3 flex-wrap text-[11.5px]">
            <span className="text-white/50">© {t('copyright', { year })}</span>
            <a
              href="https://status.mypos.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Tizim normal
            </a>
            <span className="text-white/50">🇺🇿 O&apos;zbekiston</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
