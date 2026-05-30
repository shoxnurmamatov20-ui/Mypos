'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '../cn';

type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  /** Auto-dismiss in milliseconds; pass 0 to disable. */
  duration?: number;
  /** aria-label for close button (localized). */
  closeLabel?: string;
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
};

const VARIANT_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

/**
 * Inline toast notification — auto-dismisses after `duration` ms.
 * Himoya light/dark palette.
 */
export function Toast({
  open,
  message,
  variant = 'success',
  onClose,
  duration = 2500,
  closeLabel = 'Dismiss',
}: ToastProps) {
  useEffect(() => {
    if (!open || duration === 0) return;
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [open, duration, onClose]);

  if (!open) return null;

  const Icon = VARIANT_ICON[variant];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        className={cn(
          'pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-sm',
          VARIANT_STYLES[variant],
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-mr-1 ml-2 flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-current/10"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Hook: returns `[state, show, close]` — `show(message, variant?)`. */
export function useToast() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    variant: ToastVariant;
  }>({ open: false, message: '', variant: 'success' });

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    setState({ open: true, message, variant });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return { state, show, close };
}
