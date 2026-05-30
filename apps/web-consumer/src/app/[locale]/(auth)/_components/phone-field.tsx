'use client';

import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

type Props = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  autoFocus?: boolean;
  disabled?: boolean;
};

/**
 * Phone field with sticky `+998` prefix. The 9-digit national part lives
 * in the form value; the page concatenates `+998` before submission.
 */
export function PhoneField({ id, label, registration, error, autoFocus, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
        {label}
      </label>
      <div
        className={`flex h-14 items-center gap-2 rounded-2xl border bg-neutral-50 px-4 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 ${
          error ? 'border-danger/60' : 'border-neutral-200'
        }`}
      >
        <span className="select-none text-base font-semibold text-neutral-700">+998</span>
        <span aria-hidden="true" className="h-5 w-px bg-neutral-300" />
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={9}
          placeholder="901234567"
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 bg-transparent text-base font-medium tracking-wide text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          {...registration}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
