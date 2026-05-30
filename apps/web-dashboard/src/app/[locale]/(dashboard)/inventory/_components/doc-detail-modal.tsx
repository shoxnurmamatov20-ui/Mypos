'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string | null;
  onClose: () => void;
  /** Optional badge (e.g., status pill) shown next to the title. */
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
};

const SIZE: Record<NonNullable<Props['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function DocDetailModal({
  title,
  subtitle,
  onClose,
  badge,
  children,
  footer,
  size = 'lg',
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`relative my-8 w-full ${SIZE[size]} rounded-2xl bg-white shadow-xl dark:bg-[#111827]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(22,34,31,0.09)] p-5 dark:border-[rgba(255,255,255,0.07)]">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#16221f] dark:text-white">{title}</h2>
              {badge}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[#62716d] dark:text-[#94a3b8]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#62716d] hover:bg-[#eef4f3] dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[rgba(22,34,31,0.09)] p-4 dark:border-[rgba(255,255,255,0.07)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
