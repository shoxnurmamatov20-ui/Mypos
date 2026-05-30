import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../cn';

/**
 * Light/dark text input primitive. Himoya/ShifoReyting palette —
 * teal-700 focus light, teal-500 focus dark.
 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border px-3 text-[13px] outline-none transition-colors',
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
  },
);
