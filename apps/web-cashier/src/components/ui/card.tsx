import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Light/dark card primitive. White or `#111827` surface, soft border,
 * rounded-xl, no shadow — the single container used across every cashier
 * screen.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        'rounded-xl border p-5 transition-colors',
        'border-[rgba(22,34,31,0.09)] bg-white',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]',
        className,
      )}
      {...props}
    />
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <header className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      {children}
    </header>
  );
}

type CardTitleProps = {
  children: ReactNode;
  className?: string;
  hint?: ReactNode;
};

export function CardTitle({ children, className, hint }: CardTitleProps) {
  return (
    <div className="min-w-0">
      <h3
        className={cn(
          'text-base font-semibold leading-none tracking-tight text-[#16221f] dark:text-white',
          className,
        )}
      >
        {children}
      </h3>
      {hint ? <p className="mt-1.5 text-xs text-[#62716d] dark:text-[#94a3b8]">{hint}</p> : null}
    </div>
  );
}
