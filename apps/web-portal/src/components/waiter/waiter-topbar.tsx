'use client';

import { House } from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useWaiterSession } from '@/lib/waiter-session';

const KNOWN = new Set(['tables', 'orders', 'menu', 'shift']);

/**
 * Waiter-panel topbar — the `web-superadmin` frosted 58px bar, trimmed:
 *   Left:  `[home] Ofitsiant › [●pulse] PageName`
 *   Right: language switcher + a compact user chip.
 *
 * Hidden on mobile — the sidebar provides its own mobile header there.
 */
export function WaiterTopbar() {
  const t = useTranslations('waiter');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const session = useWaiterSession();

  const segments = pathname.split('/').filter(Boolean).slice(1);
  const last = segments[segments.length - 1] ?? '';
  const pageLabel = KNOWN.has(last) ? t(`nav.${last}`) : t('nav.tables');
  const initial = (session?.name?.trim()?.charAt(0) ?? 'O').toUpperCase();

  return (
    <header className="sticky top-0 z-20 hidden h-[58px] border-b border-[rgba(22,34,31,0.09)] bg-white/90 backdrop-blur-xl lg:flex">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
          <Link
            href={`/${locale}/tables` as Route}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-[#62716d] transition-colors hover:bg-[#eef4f3] hover:text-[#16221f]"
          >
            <House className="h-3.5 w-3.5" weight="bold" />
            <span>{t('topbar.home')}</span>
          </Link>
          <span className="select-none text-[15px] leading-none text-[#62716d] opacity-60">
            ›
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#16221f]">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0f766e] opacity-50" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#0f766e] ring-[3px] ring-[rgba(15,118,110,0.10)]" />
            </span>
            <span className="truncate">{pageLabel}</span>
          </span>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {session ? (
            <div className="flex items-center gap-2 rounded-full border border-[rgba(22,34,31,0.09)] py-1 pl-1 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0d5e58] text-[12px] font-bold text-white">
                {initial}
              </span>
              <span className="max-w-[140px] truncate text-[12px] font-semibold text-[#16221f]">
                {session.name}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
