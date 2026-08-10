'use client';

import { cn } from '@mypos/ui';

export type PillTone = 'green' | 'teal' | 'amber' | 'slate' | 'blue' | 'red';

/**
 * Apple-token tones (packages/design-tokens/theme.css) — `teal` keeps its
 * name for call-site compatibility but now renders the tenant accent, not
 * the legacy Himoya teal.
 */
const TONES: Record<PillTone, string> = {
  green: 'bg-success-soft text-success-text',
  teal: 'bg-tenant-tint text-tenant',
  amber: 'bg-warning-soft text-warning-text',
  slate: 'bg-ink-muted-48/10 text-ink-muted-80',
  blue: 'bg-info-soft text-info-text',
  red: 'bg-error-soft text-error-text',
};

/** Tiny tinted status pill with a leading dot — shared by tables & orders. */
export function StatusPill({ tone, label }: { tone: PillTone; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption-strong whitespace-nowrap',
        TONES[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
