'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { WAITER_ZONES, type WaiterTable } from '@/lib/waiter-data';
import { Skeleton } from '../waiter-bits';

/**
 * Joy — the zone picker (screenshot 8.png). A plain 2-column grid of zone
 * **names only**. It deliberately does NOT show a table count per zone: the
 * old build printed "ZAL · 18 stol / VIP · 4 stol" which was the reported
 * bug — the reference app shows just the name.
 */
export function ZoneStep({
  tables,
  isLoading,
  onPick,
}: {
  tables: WaiterTable[];
  isLoading: boolean;
  onPick: (zone: string) => void;
}) {
  const t = useTranslations('waiter');

  // Zones present in the data, ordered by the canonical list first, extras last.
  const zones = useMemo(() => {
    const present = new Set(tables.map((table) => table.zone).filter(Boolean));
    const ordered = WAITER_ZONES.filter((zone) => present.has(zone));
    const extras = [...present].filter((zone) => !WAITER_ZONES.includes(zone)).sort();
    return [...ordered, ...extras];
  }, [tables]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {['a', 'b', 'c', 'd'].map((key) => (
          <Skeleton key={key} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-canvas/60 px-6 py-16 text-center text-body text-ink-muted-80">
        {t('zone.empty')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {zones.map((zone) => (
        <button
          key={zone}
          type="button"
          onClick={() => onPick(zone)}
          className="flex h-28 items-center justify-center rounded-lg border border-hairline-soft bg-canvas px-4 text-center transition-all duration-200 hover:border-tenant/40 hover:bg-parchment active:scale-95"
        >
          <span className="font-display text-tagline uppercase text-ink">{zone}</span>
        </button>
      ))}
    </div>
  );
}
