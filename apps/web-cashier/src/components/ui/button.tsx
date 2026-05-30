import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0f766e] text-white hover:bg-[#0c5f58] disabled:bg-[#0f766e]/50',
  secondary:
    'border border-[rgba(22,34,31,0.12)] bg-white text-[#16221f] hover:border-[#0f766e] hover:text-[#0f766e] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#111827] dark:text-white dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6]',
  ghost:
    'text-[#62716d] hover:bg-[#eef4f3] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** The single button primitive — pill-free, register-friendly hit areas. */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
