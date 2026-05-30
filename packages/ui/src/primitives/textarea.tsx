import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';

/** Light/dark textarea primitive — mirrors Input styling. */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'block w-full rounded-md border px-3 py-2 text-[13px] outline-none transition-colors resize-y',
        'border-[rgba(22,34,31,0.09)] bg-white text-[#16221f] placeholder:text-[#62716d]',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:text-white dark:placeholder:text-[#94a3b8]',
        'focus:border-[#0f766e] dark:focus:border-[#14b8a6]',
        'focus:ring-2 focus:ring-[rgba(15,118,110,0.15)] dark:focus:ring-[rgba(20,184,166,0.18)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
});
