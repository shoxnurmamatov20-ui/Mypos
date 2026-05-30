'use client';

import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Tailwind max-width class for the dialog container. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Lightweight light/dark modal primitive: dimmed backdrop + centered
 * card with a close button and `Esc` to dismiss. Locks body scroll
 * while open so background scrolling doesn't bleed through.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(10,15,20,0.5)] backdrop-blur-[3px]"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-xl border bg-white dark:bg-[#111827] shadow-[0_20px_60px_rgba(0,0,0,0.35)]',
          'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
          SIZE_CLASS[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-5 py-3.5">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-[14px] font-extrabold text-[#16221f] dark:text-white"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#62716d] dark:text-[#94a3b8] transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
