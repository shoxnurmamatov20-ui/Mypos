'use client';

import { cn } from '@mypos/ui';
import { forwardRef, useState } from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * MedRisk-style input. Gray border, brand focus ring with subtle halo.
 * Tighter dimensions than Apple — feels more "office productivity".
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, className, type, ...props }, ref) => {
    const id = props.id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const [revealed, setRevealed] = useState(false);
    const effectiveType = isPassword && revealed ? 'text' : type;

    return (
      <div className="flex flex-col gap-[6px]">
        <label htmlFor={id} className="text-[13px] font-semibold text-black">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={effectiveType}
            className={cn(
              'block w-full h-[42px] px-[12px] rounded-lg border bg-white',
              'text-[14px] text-black placeholder:text-black/40',
              'outline-none transition focus:ring-2',
              isPassword ? 'pr-[44px]' : '',
              error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                : 'border-black/15 focus:border-black focus:ring-black/15',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-md flex items-center justify-center text-black/50 hover:text-black hover:bg-black/5 transition"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {revealed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          ) : null}
        </div>

        {error ? (
          <span id={`${id}-error`} className="text-[12px] text-red-600" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${id}-hint`} className="text-[12px] text-black/50">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);

Field.displayName = 'Field';

function EyeIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 4C4 4 1.5 8 1.5 8S4 12 8 12 14.5 8 14.5 8 12 4 8 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 2L14 14M6.5 5.5C5 6.5 1.5 8 1.5 8S4 12 8 12C9.5 12 10.7 11.5 11.5 11M9.5 6.4C10.6 6.7 14.5 8 14.5 8S13.5 9.5 12 10.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
