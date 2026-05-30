import type { ReactNode } from 'react';

/**
 * Page heading block — big display title, optional muted subtitle, and
 * an optional right-aligned action slot. Sits above the card grid on
 * every authenticated CEO page so the surfaces stay visually consistent.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-1 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] sm:text-[26px] font-bold leading-tight tracking-tight text-[#16221f] dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
