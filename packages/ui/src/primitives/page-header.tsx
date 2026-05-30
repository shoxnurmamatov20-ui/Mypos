import type { ReactNode } from 'react';
import { cn } from '../cn';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  breadcrumbs?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-2', className)}>
      {breadcrumbs ? (
        <div className="text-xs text-[#62716d] dark:text-[#94a3b8]">{breadcrumbs}</div>
      ) : null}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-[#16221f] dark:text-white leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
