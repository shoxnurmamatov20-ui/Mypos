'use client';

import { cn } from '@mypos/ui';
import { Circle, Plus } from '@phosphor-icons/react';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useEffect } from 'react';
import type { WaiterSession } from '@/lib/waiter-session';

/** Slide-up bottom sheet — dim backdrop, rounded top, locks body scroll. */
export function BottomSheet({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={label}
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(10,15,20,0.4)] backdrop-blur-[2px] backdrop-saturate-150"
      />
      <div className="animate-fade-in relative z-10 max-h-[80vh] overflow-y-auto rounded-t-lg bg-canvas pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink-muted-48/30" />
        {children}
      </div>
    </div>
  );
}

interface RadioRowProps {
  label: string;
  meta?: string;
  selected: boolean;
  onClick: () => void;
}

function RadioRow({ label, meta, selected, onClick }: RadioRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-t border-hairline-soft px-5 py-4 text-left transition-colors hover:bg-parchment"
    >
      <span
        className={cn(
          'grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2',
          selected ? 'border-tenant' : 'border-ink-muted-48/40',
        )}
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-tenant" /> : null}
      </span>
      <span className="flex-1 text-body text-ink">
        {label}
        {meta ? <span className="text-ink-muted-48"> ({meta})</span> : null}
      </span>
    </button>
  );
}

const LOCALES: Array<{ code: string; label: string }> = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'kz', label: 'Қазақша' },
];

/** Language picker sheet — radio list of the four supported locales. */
export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('waiter');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: string) => {
    if (next !== locale) {
      const segments = pathname.split('/');
      segments[1] = next;
      router.push(segments.join('/') as Route);
    }
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} label={t('common.close')}>
      <p className="px-5 py-2 text-caption-strong text-ink">{t('account.language')}</p>
      {LOCALES.map((option) => (
        <RadioRow
          key={option.code}
          label={option.label}
          selected={option.code === locale}
          onClick={() => switchTo(option.code)}
        />
      ))}
    </BottomSheet>
  );
}

/**
 * Account switcher sheet (screenshot 2.png). "+ Hisob qo'shish" plus a radio
 * list of accounts saved on this device (the signed-in one is preselected).
 */
export function AccountSwitcher({
  open,
  onClose,
  session,
  onAddAccount,
}: {
  open: boolean;
  onClose: () => void;
  session: WaiterSession | null;
  onAddAccount: () => void;
}) {
  const t = useTranslations('waiter');
  const role = t('account.role');

  return (
    <BottomSheet open={open} onClose={onClose} label={t('common.close')}>
      <button
        type="button"
        onClick={onAddAccount}
        className="flex w-full items-center gap-3 px-5 py-4 text-left text-tenant transition-colors hover:bg-parchment"
      >
        <Plus className="h-5 w-5" weight="bold" />
        <span className="text-body-strong">{t('account.addAccount')}</span>
      </button>
      {session ? (
        <RadioRow label={session.name} meta={role} selected onClick={onClose} />
      ) : (
        <div className="flex items-center gap-3 border-t border-hairline-soft px-5 py-4 text-ink-muted-48">
          <Circle className="h-5 w-5" />
          <span className="text-body">—</span>
        </div>
      )}
    </BottomSheet>
  );
}
