import type { TenantPlan, TenantStatus, TenantSummary } from '@/types/super-admin';

export type SortKey =
  | 'mrr_desc'
  | 'mrr_asc'
  | 'created_desc'
  | 'name_asc'
  | 'last_active_desc';

export type PlanFilter = TenantPlan | 'all';
export type StatusFilter = TenantStatus | 'all';

/**
 * Pure helper that filters + sorts the tenant list. Keeping it outside any
 * React component lets us unit-test the logic without rendering.
 */
export function applyTenantFilters(
  rows: readonly TenantSummary[],
  options: {
    query: string;
    plan: PlanFilter;
    status: StatusFilter;
    sort: SortKey;
  },
): TenantSummary[] {
  const q = options.query.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (options.plan !== 'all' && row.plan !== options.plan) return false;
    if (options.status !== 'all' && row.status !== options.status) return false;
    if (q.length === 0) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.slug.toLowerCase().includes(q) ||
      row.owner_email.toLowerCase().includes(q) ||
      row.owner_name.toLowerCase().includes(q)
    );
  });

  // Sort copy so we don't mutate caller arrays.
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (options.sort) {
      case 'mrr_desc':
        return b.mrr_minor - a.mrr_minor;
      case 'mrr_asc':
        return a.mrr_minor - b.mrr_minor;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'last_active_desc': {
        const at = a.last_active_at ? Date.parse(a.last_active_at) : 0;
        const bt = b.last_active_at ? Date.parse(b.last_active_at) : 0;
        return bt - at;
      }
      case 'created_desc':
      default:
        return Date.parse(b.created_at) - Date.parse(a.created_at);
    }
  });

  return sorted;
}

/** Stable colour for the avatar circle, picked from the brand palette. */
export function pickAvatarColor(seed: string): string {
  const palette = [
    'bg-brand-500',
    'bg-mint-600',
    'bg-blue-500',
    'bg-purple-500',
    'bg-yellow-600',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
  ] as const;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx] ?? palette[0]!;
}
