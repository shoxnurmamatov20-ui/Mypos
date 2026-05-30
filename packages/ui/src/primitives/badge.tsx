import type { ReactNode } from 'react';
import { cn } from '../cn';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'teal'
  | 'outline';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
    outline: 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
