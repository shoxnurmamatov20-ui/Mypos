'use client';

import { cn } from '@mypos/ui';

export type PillTone = 'green' | 'teal' | 'amber' | 'slate' | 'blue' | 'red';

const TONES: Record<PillTone, string> = {
  green: 'bg-[rgba(24,121,78,0.10)] text-[#18794e]',
  teal: 'bg-[rgba(15,118,110,0.10)] text-[#0f766e]',
  amber: 'bg-[rgba(183,121,31,0.12)] text-[#b7791f]',
  slate: 'bg-[rgba(22,34,31,0.06)] text-[#62716d]',
  blue: 'bg-[rgba(37,99,235,0.10)] text-[#2563eb]',
  red: 'bg-[rgba(180,35,24,0.10)] text-[#b42318]',
};

/** Tiny tinted status pill with a leading dot — shared by tables & orders. */
export function StatusPill({ tone, label }: { tone: PillTone; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        TONES[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
