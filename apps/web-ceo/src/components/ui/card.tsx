import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Light/dark card primitive (himoya admin pattern). White or `#111827`
 * surface, soft gray / 7%-white border, rounded-xl, no shadow. Wraps a
 * `<section>` so each card has an implicit landmark for assistive tech.
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

/** Top-of-card row: title on the left, action / link / chip on the right. */
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

/**
 * Card title with optional secondary hint below it (e.g. period total or
 * subtle metadata). The hint stays on the same column as the title to
 * keep the right side free for actions.
 */
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

/** Optional standalone description (himoya pattern). */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[#62716d] dark:text-[#94a3b8]', className)} {...props} />;
}

/** Optional content slot for stacked layouts (himoya pattern). */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

/** Optional footer row for actions (himoya pattern). */
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 flex items-center pt-4 border-t',
        'border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
