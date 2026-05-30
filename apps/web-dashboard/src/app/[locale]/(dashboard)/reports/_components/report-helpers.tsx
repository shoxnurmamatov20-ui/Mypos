'use client';

import type { ReactNode } from 'react';

/* ───── Date helpers ─────────────────────────────────────────────────────── */

/** YYYY-MM-DD (today). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** YYYY-MM-DD N days ago. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD N days ago (string-typed) — `addDays(today(), -1)` style. */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ───── Number formatting ────────────────────────────────────────────────── */

export function formatNumber(n: number | null | undefined, maxDigits = 3): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '0';
  if (n === 0) return '0';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: maxDigits }).format(n);
}

/* ───── Shared input class ───────────────────────────────────────────────── */

export const inputClass =
  'w-full rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white dark:focus:border-teal-500';

/* ───── Simple stat card (matches consumption page) ──────────────────────── */

export function SimpleStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative' | 'muted';
}) {
  const valueClass =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : tone === 'muted'
          ? 'text-[#62716d] dark:text-[#94a3b8]'
          : 'text-[#16221f] dark:text-white';

  return (
    <div className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-4 py-3 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <p className="text-xs text-[#62716d] dark:text-[#94a3b8]">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-[#94a3b8] dark:text-[#64748b]">{hint}</p>
      ) : null}
    </div>
  );
}

/* ───── Labelled field wrapper (matches consumption page) ────────────────── */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[#62716d] dark:text-[#94a3b8]">{label}</span>
      {children}
    </label>
  );
}

/* ───── Section heading (used for sub-sections within a report page) ─────── */

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-[#16221f] dark:text-white">{children}</h2>
  );
}

/* ───── Page title (matches consumption page top h1) ─────────────────────── */

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[20px] font-semibold tracking-tight text-[#16221f] dark:text-white">
      {children}
    </h1>
  );
}

/* ───── Generic table shell + skeleton ───────────────────────────────────── */

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function LoadingHint({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-4 py-8 text-center text-sm text-[#62716d] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:text-[#94a3b8]">
      {label}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
        >
          {retryLabel ?? 'Qayta urinish'}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[rgba(22,34,31,0.15)] bg-white py-12 text-center dark:border-[rgba(255,255,255,0.10)] dark:bg-[#111827]">
      <div className="text-[#94a3b8]">{icon}</div>
      <p className="text-sm font-semibold text-[#16221f] dark:text-white">{title}</p>
      {description ? (
        <p className="mx-auto max-w-md text-xs text-[#62716d] dark:text-[#94a3b8]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ───── Ranked top-N list (Z-Report top items / waiters) ─────────────────── */

export type TopRankRow = {
  rank: number;
  name: string;
  count: string;
  revenue: string;
};

export function TopRankList({
  rows,
  headers,
  emptyTitle,
  emptyIcon,
}: {
  rows: TopRankRow[];
  headers: { rank: string; name: string; quantity: string; revenue: string };
  emptyTitle: string;
  emptyIcon: ReactNode;
}) {
  if (rows.length === 0) {
    return <EmptyCard icon={emptyIcon} title={emptyTitle} />;
  }
  return (
    <TableShell>
      <table className="w-full text-sm">
        <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
          <tr>
            <th className="w-8 px-4 py-2.5 font-medium">{headers.rank}</th>
            <th className="px-4 py-2.5 font-medium">{headers.name}</th>
            <th className="px-4 py-2.5 font-medium text-right">{headers.quantity}</th>
            <th className="px-4 py-2.5 font-medium text-right">{headers.revenue}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
          {rows.map((r) => (
            <tr key={r.rank}>
              <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">{r.rank}</td>
              <td className="px-4 py-2.5 text-[#16221f] dark:text-white">{r.name}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                {r.count}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                {r.revenue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}
