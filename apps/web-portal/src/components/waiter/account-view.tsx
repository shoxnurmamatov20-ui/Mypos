'use client';

import {
  ArrowsClockwise,
  CaretRight,
  ClockCounterClockwise,
  type Icon,
  ImageSquare,
  Receipt,
  SignOut,
  Translate,
} from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { logout as apiLogout } from '@/lib/api';
import { clearWaiterSession, useWaiterSession } from '@/lib/waiter-session';
import { AccountSwitcher, LanguageSheet } from './account-sheets';

/** Akkaunt (screenshots 1/3.png) — profile card + red-icon action rows. */
export function AccountView() {
  const t = useTranslations('waiter');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const session = useWaiterSession();
  const [sheet, setSheet] = useState<'lang' | 'accounts' | null>(null);

  const goLogin = () => {
    window.location.href = `/panel/portal/${locale}/login`;
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore — clear the local session and leave regardless.
    }
    clearWaiterSession();
    goLogin();
  };

  return (
    <div className="animate-fade-in mx-auto max-w-[560px] space-y-6">
      {/* Profile */}
      <div className="flex flex-col items-center gap-1.5 pt-4 text-center">
        <span className="mb-1 grid h-24 w-24 place-items-center rounded-full bg-tenant-tint text-tenant/50">
          <ImageSquare className="h-9 w-9" />
        </span>
        <p className="font-display text-tagline text-ink">{session?.name ?? '—'}</p>
        {session?.phone ? (
          <p className="text-caption tabular-nums text-ink-muted-48">{session.phone}</p>
        ) : null}
        <p className="text-caption-strong text-tenant">{t('account.role')}</p>
      </div>

      {/* Action rows */}
      <div className="divide-y divide-hairline-soft border-y border-hairline-soft">
        <Row icon={Receipt} label={t('account.orderHistory')} href={`/${locale}/orders` as Route} />
        <Row icon={Translate} label={t('account.language')} onClick={() => setSheet('lang')} />
        <Row
          icon={ClockCounterClockwise}
          label={t('account.workTime')}
          href={`/${locale}/shift` as Route}
        />
        <Row icon={SignOut} label={t('account.logout')} onClick={handleLogout} />
        <Row
          icon={ArrowsClockwise}
          label={t('account.switchAccount')}
          onClick={() => setSheet('accounts')}
        />
      </div>

      <LanguageSheet open={sheet === 'lang'} onClose={() => setSheet(null)} />
      <AccountSwitcher
        open={sheet === 'accounts'}
        onClose={() => setSheet(null)}
        session={session}
        onAddAccount={goLogin}
      />
    </div>
  );
}

/** One profile row: red circular icon, label, trailing chevron. */
function Row({
  icon: RowIcon,
  label,
  href,
  onClick,
}: {
  icon: Icon;
  label: string;
  href?: Route;
  onClick?: () => void;
}) {
  const body: ReactNode = (
    <>
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-tenant text-tenant-on-primary">
        <RowIcon className="h-[18px] w-[18px]" weight="bold" />
      </span>
      <span className="flex-1 text-left text-body text-ink">{label}</span>
      <CaretRight className="h-4 w-4 flex-shrink-0 text-ink-muted-48" />
    </>
  );
  const className = 'flex w-full items-center gap-3.5 py-3.5 transition-colors active:opacity-70';

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
