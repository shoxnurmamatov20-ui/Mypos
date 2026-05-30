'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
};

export function SubmitButton({ loading, disabled, children }: Props) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 text-lg font-bold text-white shadow-md shadow-brand-500/30 transition active:bg-brand-700 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
