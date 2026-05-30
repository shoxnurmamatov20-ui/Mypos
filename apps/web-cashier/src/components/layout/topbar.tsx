'use client';

import { Store } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { ShiftBadge } from './shift-badge';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const KNOWN_SEGMENTS = new Set(['pos', 'orders', 'payments', 'shift']);

/**
 * Compact sticky topbar — kept deliberately minimal (no command palette,
 * no notification bell, no filters). Left: `Kassa › PageName`. Right: the
 * live shift chip, language, theme, user menu. Desktop only — the sidebar
 * owns the mobile top bar.
 */
export function Topbar() {
  const t = useTranslations('topbar');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';

  const segments = pathname.split('/').filter(Boolean).slice(1);
  const lastSegment = segments[segments.length - 1] ?? '';
  const pageLabel = KNOWN_SEGMENTS.has(lastSegment) ? t(lastSegment) : t('home');

  return (
    <header className="sticky top-0 z-20 hidden h-[58px] border-b border-[rgba(22,34,31,0.09)] bg-white/[0.92] backdrop-blur-xl lg:flex dark:border-[rgba(255,255,255,0.07)] dark:bg-[#0b1120]/[0.88]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
          <Link
            href={`/${locale}/pos`}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-[#62716d] transition-colors hover:bg-[#eef4f3] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white"
          >
            <Store className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>{t('home')}</span>
          </Link>
          <span className="select-none text-[15px] leading-none text-[#62716d] opacity-60 dark:text-[#94a3b8]">
            ›
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#16221f] dark:text-white">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0f766e] opacity-50" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#0f766e] ring-[3px] ring-[rgba(15,118,110,0.1)]" />
            </span>
            <span className="truncate">{pageLabel}</span>
          </span>
        </nav>

        {/* Right actions — intentionally lean */}
        <div className="flex items-center gap-1.5">
          <ShiftBadge />
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
