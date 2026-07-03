'use client';

import type { LucideIcon } from 'lucide-react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';

type Props = {
  /** Anchor `id` for the sticky-nav active-state observer. */
  id?: string;
  title: string;
  description?: string;
  /** Optional accent icon shown in a small coloured box next to the title. */
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  children: ReactNode;
  /** Save button — pass null to hide (e.g. read-only sections). */
  onSave?: () => void;
  saving?: boolean;
  showSave?: boolean;
  /** Footer area — e.g. test-email button under SMTP info. */
  footer?: ReactNode;
};

/**
 * Settings section card wrapper — coloured icon box + title +
 * description in the header, scrollable body, save button on the
 * right. The save button surfaces three states:
 *   - default → "Saqlash"
 *   - saving  → spinner + "Saqlanmoqda…"
 *   - just saved → green check + "Saqlandi" for 1 second
 *
 * Each section anchors to its `id` so the sticky vertical nav can
 * target it via `scrollIntoView`.
 */
export function SettingsSection({
  id,
  title,
  description,
  icon: Icon,
  iconColor = 'text-teal-700 dark:text-teal-400',
  iconBg = 'bg-teal-50 dark:bg-teal-500/15',
  children,
  onSave,
  saving = false,
  showSave = true,
  footer,
}: Props) {
  const t = useTranslations('settings_page');
  const [justSaved, setJustSaved] = useState(false);

  // Flip to "just saved" state for 1s when the saving prop transitions
  // from true → false (i.e. the parent mutation resolved).
  const [prevSaving, setPrevSaving] = useState(saving);
  useEffect(() => {
    if (prevSaving && !saving) {
      setJustSaved(true);
      const timer = window.setTimeout(() => setJustSaved(false), 1000);
      return () => window.clearTimeout(timer);
    }
    setPrevSaving(saving);
    return;
  }, [saving, prevSaving]);

  return (
    <Card id={id} className="p-4 md:p-5 scroll-mt-20">
      <CardHeader className="mb-4 flex-col sm:flex-row sm:items-start sm:justify-between gap-3 items-start">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon ? (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                iconBg,
              )}
              aria-hidden="true"
            >
              <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={2} />
            </div>
          ) : null}
          <CardTitle hint={description}>{title}</CardTitle>
        </div>
        {showSave && onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            aria-busy={saving}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-bold transition-colors duration-150 shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              'disabled:cursor-not-allowed disabled:opacity-80',
              justSaved
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                : 'bg-teal-700 hover:bg-teal-800 text-white',
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Saqlanmoqda…</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                <span>{t('saved_toast')}</span>
              </>
            ) : (
              <span>{t('save_button')}</span>
            )}
          </button>
        ) : null}
      </CardHeader>
      <div className="space-y-5">{children}</div>
      {footer ? (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">{footer}</div>
      ) : null}
    </Card>
  );
}

type FieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  /** Show a red asterisk after the label. */
  required?: boolean;
};

/**
 * Labelled form row with optional helper text under the label. Uses a
 * responsive 3-column grid on `sm+` so the label stays left of the
 * input, single-column stack below. Hint sits under the label on
 * desktop and under the input on mobile so it doesn't push the input
 * off-screen.
 */
export function Field({ label, htmlFor, children, hint, required = false }: FieldProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 sm:items-start sm:gap-4">
      <div className="sm:pt-2.5">
        <label htmlFor={htmlFor} className="block text-xs font-bold text-gray-900 dark:text-white">
          {label}
          {required ? (
            <span className="text-red-600 dark:text-red-400 ml-0.5" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <p className="hidden sm:block mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="sm:col-span-2 space-y-1">
        {children}
        {hint ? (
          <p className="sm:hidden text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Shared `<select>` styling — matches the Settings input + filter chips. */
export const SETTINGS_SELECT_CLASS =
  'h-9 w-full rounded-md border px-3 text-sm font-medium outline-none transition-colors duration-150 ' +
  'border-gray-200 bg-white text-gray-900 ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-white ' +
  'focus:border-teal-500 dark:focus:border-teal-400 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

/** Compact information banner — used in read-only sections (Email, To'lovlar). */
export function SettingsBanner({
  icon: Icon,
  variant = 'info',
  children,
}: {
  icon?: LucideIcon;
  variant?: 'info' | 'warning';
  children: ReactNode;
}) {
  const cls =
    variant === 'warning'
      ? 'border-amber-300/60 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200'
      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400';

  return (
    <div className={cn('flex items-start gap-2 px-3 py-2 rounded-md border text-xs', cls)}>
      {Icon ? (
        <Icon
          className={cn(
            'h-3.5 w-3.5 mt-0.5 shrink-0',
            variant === 'warning'
              ? 'text-amber-600 dark:text-amber-300'
              : 'text-gray-500 dark:text-gray-400',
          )}
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </div>
  );
}
