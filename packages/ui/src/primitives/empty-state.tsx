import type { ReactNode } from 'react';
import { cn } from '../cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16 rounded-xl border',
        'border-dashed border-[rgba(22,34,31,0.12)] dark:border-[rgba(255,255,255,0.10)]',
        'bg-white/50 dark:bg-[#0f172a]/50',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4f3] dark:bg-[#1a2235] text-[#0f766e] dark:text-teal-400">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[#16221f] dark:text-white">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-[#62716d] dark:text-[#94a3b8]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
