'use client';

import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

type Props = {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email';
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  autoFocus?: boolean;
  disabled?: boolean;
};

export function TextField({
  id,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  registration,
  error,
  autoFocus,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
        {label}
      </label>
      <div
        className={`flex h-14 items-center rounded-2xl border bg-neutral-50 px-4 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 ${
          error ? 'border-danger/60' : 'border-neutral-200'
        }`}
      >
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
