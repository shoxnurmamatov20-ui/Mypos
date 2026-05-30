'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

type Props = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  autoComplete?: 'current-password' | 'new-password';
  toggleShowLabel: string;
  toggleHideLabel: string;
  disabled?: boolean;
};

export function PasswordField({
  id,
  label,
  registration,
  error,
  autoComplete = 'current-password',
  toggleShowLabel,
  toggleHideLabel,
  disabled,
}: Props) {
  const [visible, setVisible] = useState(false);

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
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder="••••••••"
          className="flex-1 bg-transparent text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? toggleHideLabel : toggleShowLabel}
          aria-pressed={visible}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
