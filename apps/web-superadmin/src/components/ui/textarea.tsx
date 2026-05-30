import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Dark-themed textarea primitive — mirrors `Input` styling. */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500',
        'transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'resize-y',
        className,
      )}
      {...props}
    />
  );
});
