'use client';

import { cn } from '@mypos/ui';
import { type LucideIcon, Minus, Plus } from 'lucide-react';

/** Shared himoya-styled input/select class (matches the rest of the dashboard). */
export const inputClass =
  'w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2 text-sm focus:border-[#0f766e] dark:focus:border-teal-500 focus:outline-none disabled:opacity-60';

export const primaryBtnClass =
  'rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-colors active:scale-[0.98]';

export const secondaryBtnClass =
  'rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-4 py-2 text-sm font-medium text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] transition-colors active:scale-[0.98]';

/** Section card container. */
export function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] shadow-[0_1px_2px_rgba(18,34,31,0.04)]">
      {(title || description) && (
        <header className="border-b border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] px-5 py-4 sm:px-6">
          {title && (
            <h2 className="text-[15px] font-semibold tracking-tight text-[#16221f] dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">{description}</p>
          )}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer && (
        <footer className="flex items-center justify-end gap-2 border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] px-5 py-4 sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** Labeled field wrapper. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[12px] text-[#62716d] dark:text-[#94a3b8]">{hint}</span>
      )}
    </label>
  );
}

/** Accessible on/off switch. */
export function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120] active:scale-95',
        checked ? 'bg-[#0f766e] dark:bg-[#14b8a6]' : 'bg-black/15 dark:bg-white/20',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

/** Toggle with a label + optional description, laid out as a row. */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] text-[#62716d] dark:text-[#94a3b8]">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

/** Centered loading skeleton used while the settings store hydrates. */
export function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#eef4f3] dark:bg-[#111827]"
        />
      ))}
    </div>
  );
}

/** Labeled wrapper for non-input controls (segmented control, stepper, etc.). */
export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[12px] text-[#62716d] dark:text-[#94a3b8]">{hint}</span>
      )}
    </div>
  );
}

export type SegmentOption<T extends string> = { value: T; label: string; icon?: LucideIcon };

/** Pill-style segmented selector — a touch-friendly replacement for short <select>s. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-1 rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#e8ecec] dark:bg-[#0e1626] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold tracking-tight transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] active:scale-95',
              active
                ? 'bg-white dark:bg-teal-500/20 text-[#0f766e] dark:text-teal-300 shadow-[0_1px_3px_rgba(18,34,31,0.16)] dark:ring-1 dark:ring-teal-400/25'
                : 'text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white',
            )}
          >
            {Icon ? <Icon className="h-4 w-4" strokeWidth={2.2} /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact −/+ number stepper (cleaner than a bare number input for small ranges). */
export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  const btn =
    'flex h-9 w-9 items-center justify-center text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] disabled:opacity-40 disabled:hover:bg-transparent transition-colors active:scale-90 outline-none';
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="−"
      >
        <Minus className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <span className="w-12 text-center text-sm font-semibold tabular-nums [font-feature-settings:'tnum'] text-[#16221f] dark:text-white">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="+"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}
