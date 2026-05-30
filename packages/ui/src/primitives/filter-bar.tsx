import type { ReactNode } from 'react';
import { cn } from '../cn';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center gap-2 rounded-lg border p-3',
        'border-[rgba(22,34,31,0.09)] bg-white',
        'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]',
        className,
      )}
    >
      {children}
    </div>
  );
}
