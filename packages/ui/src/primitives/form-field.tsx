import type { ReactNode } from 'react';
import { cn } from '../cn';

interface FormFieldProps {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  helper,
  error,
  required,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-[12px] font-semibold text-[#16221f] dark:text-[#e2e8f0]"
        >
          {label}
          {required ? <span className="text-red-500 ml-0.5">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">{helper}</p>
      ) : null}
    </div>
  );
}
