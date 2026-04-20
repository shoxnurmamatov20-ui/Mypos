'use client';

import type { Ingredient } from '@mypos/api-client';

/**
 * Green if current > reorder_point (or min_stock * 2 if reorder not set),
 * yellow if current > min_stock but below reorder,
 * red if current <= min_stock,
 * gray if no min_stock configured.
 */
export function StockLevelBar({ ingredient }: { ingredient: Ingredient }) {
  const { current_stock: current, min_stock: min, reorder_point: reorder } = ingredient;

  const threshold = min ?? 0;
  const reorderPt = reorder ?? threshold * 2;
  // Bar scale: 100% = 2x reorder (or min*4) whichever is higher
  const ceiling = Math.max(reorderPt * 2, threshold * 4, current);
  const pct = ceiling > 0 ? Math.min(100, Math.round((current / ceiling) * 100)) : 0;

  let color = 'bg-neutral-300';
  if (min !== null) {
    if (current <= min) color = 'bg-red-500';
    else if (current <= reorderPt) color = 'bg-yellow-500';
    else color = 'bg-green-500';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
