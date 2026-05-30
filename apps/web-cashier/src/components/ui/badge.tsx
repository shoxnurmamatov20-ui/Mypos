import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-[#e6f3f1] text-[#0f766e] dark:bg-[#0f766e]/20 dark:text-[#5ed6c9]',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
};

/** Tinted status pill. No border, readable in both themes. */
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
