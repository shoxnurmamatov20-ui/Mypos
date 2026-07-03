import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '../cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Himoya-style button. Teal primary, surface2 secondary, transparent ghost,
 * red danger, outline. Loading spinner + optional icons.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0f766e] text-white hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] focus:ring-[rgba(15,118,110,0.30)] dark:focus:ring-[rgba(20,184,166,0.40)]',
    secondary:
      'bg-[#eef4f3] text-[#16221f] hover:bg-[#dde9e8] dark:bg-[#1a2235] dark:text-white dark:hover:bg-[#222b40] focus:ring-[rgba(22,34,31,0.15)] dark:focus:ring-[rgba(255,255,255,0.10)]',
    ghost:
      'bg-transparent text-[#16221f] hover:bg-[#eef4f3] dark:text-white dark:hover:bg-[#1a2235] focus:ring-[rgba(22,34,31,0.15)] dark:focus:ring-[rgba(255,255,255,0.10)]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-400/40',
    outline:
      'border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-transparent text-[#16221f] dark:text-white hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] focus:ring-[rgba(22,34,31,0.15)]',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-[12px]',
    md: 'h-9 px-4 text-[13px]',
    lg: 'h-11 px-5 text-[14px]',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors outline-none',
        'focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0b1120]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon ? <span className="inline-flex shrink-0">{rightIcon}</span> : null}
    </button>
  );
});
