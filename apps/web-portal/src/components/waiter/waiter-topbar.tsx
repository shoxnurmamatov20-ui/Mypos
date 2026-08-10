'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useWaiterSession } from '@/lib/waiter-session';

const KNOWN = new Set(['tables', 'orders', 'menu', 'shift', 'account']);
/** Route segments whose topbar label lives under a different i18n key. */
const LABEL_ALIAS: Record<string, string> = { 'new-order': 'newOrder' };

/**
 * Waiter-panel topbar — **desktop only** (`lg:` and up):
 * `[home] Ofitsiant › [●pulse] PageName` breadcrumb + language switcher + user
 * chip. On mobile every screen renders its own header (centered title, or the
 * in-flow back bar), so the topbar steps out of the way entirely below `lg:`.
 */
export function WaiterTopbar() {
  const t = useTranslations('waiter');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const session = useWaiterSession();

  const segments = pathname.split('/').filter(Boolean).slice(1);
  const last = segments[segments.length - 1] ?? '';
  const aliased = LABEL_ALIAS[last];
  const pageLabel = aliased
    ? t(`nav.${aliased}`)
    : KNOWN.has(last)
      ? t(`nav.${last}`)
      : t('nav.home');
  const initial = (session?.name?.trim()?.charAt(0) ?? 'O').toUpperCase();

  return (
    <>
      {/* Desktop breadcrumb bar — mobile screens carry their own headers */}
      <header className="sticky top-0 z-20 hidden h-[58px] border-b border-hairline-soft bg-canvas/85 backdrop-blur-xl backdrop-saturate-150 lg:flex">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-6">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
            <Link
              href={`/${locale}/tables` as Route}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-nav-link font-semibold text-ink-muted-80 transition-colors hover:bg-tenant-tint hover:text-ink"
            >
              <span>{t('topbar.home')}</span>
            </Link>
            <span className="select-none text-ink-muted-48 opacity-60">›</span>
            <span className="inline-flex items-center gap-1.5 text-caption-strong text-ink">
              <span className="relative flex h-[7px] w-[7px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tenant opacity-50" />
                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-tenant ring-[3px] ring-tenant-tint" />
              </span>
              <span className="truncate">{pageLabel}</span>
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {session ? (
              <div className="flex items-center gap-2 rounded-pill border border-hairline-soft py-1 pl-1 pr-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-coral-tint text-nav-link font-semibold text-coral">
                  {initial}
                </span>
                <span className="max-w-[140px] truncate text-nav-link font-semibold text-ink">
                  {session.name}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
