'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  /** Optional className for the outer wrapper. */
  className?: string;
};

/**
 * Toggle switch with optional label + description on the left and the
 * switch on the right. Real `<button role="switch">` so screen readers
 * announce the state correctly. Teal-on / surface2-off in both light +
 * dark themes — identical to web-superadmin's switch.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  const descriptionId = useId();

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      {label || description ? (
        <div className="min-w-0 flex-1">
          {label ? (
            <p className="text-[13px] font-bold text-[#16221f] dark:text-white">{label}</p>
          ) : null}
          {description ? (
            <p id={descriptionId} className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(15,118,110,0.30)] dark:focus:ring-[rgba(20,184,166,0.40)] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111827]',
          checked ? 'bg-[#0f766e] dark:bg-[#14b8a6]' : 'bg-gray-300 dark:bg-[#1a2235]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
