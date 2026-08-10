'use client';

import { cn } from '@mypos/ui';
import { WifiSlash } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

/** Shimmer placeholder block — sized by the caller via className. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink-muted-48/10', className)} />;
}

/** Quiet "demo data" pill shown when the API is unreachable and the view
 *  fell back to fixtures — the panel never pretends fixtures are live. */
export function DemoBadge({ show }: { show: boolean }) {
  const t = useTranslations('waiter');
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-fine-print font-semibold text-warning-text">
      <WifiSlash className="h-3.5 w-3.5" />
      {t('common.demo')}
    </span>
  );
}
