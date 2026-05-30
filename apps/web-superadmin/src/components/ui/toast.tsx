'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tiny inline toast notification — auto-dismisses after `duration` ms.
 * Used by the settings + admins flows to confirm save/invitation.
 *
 * The full app would normally use `sonner`, but it's not installed here
 * yet; this keeps the bundle slim and the dependency tree clean.
 */
type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  /** Auto-dismiss in milliseconds; pass 0 to disable. */
  duration?: number;
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-mint-500/40 bg-mint-500/10 text-mint-300',
  error: 'border-danger/40 bg-danger/10 text-red-300',
  info: 'border-info/40 bg-info/10 text-blue-300',
};

export function Toast({
  open,
  message,
  variant = 'success',
  onClose,
  duration = 2500,
}: ToastProps) {
  useEffect(() => {
    if (!open || duration === 0) return;
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [open, duration, onClose]);

  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        className={cn(
          'pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-sm',
          VARIANT_STYLES[variant],
        )}
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-mr-1 ml-2 flex h-7 w-7 items-center justify-center rounded-lg text-current/70 transition hover:bg-white/10"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Hook helper: returns `[toast, show]` — `show(message, variant?)`. */
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
