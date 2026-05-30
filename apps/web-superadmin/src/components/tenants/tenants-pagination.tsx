'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

const PER_PAGE_OPTIONS = [25, 50, 100, 200] as const;
export type PerPage = (typeof PER_PAGE_OPTIONS)[number];

type Props = {
  page: number;
  totalPages: number;
  totalRows: number;
  perPage: PerPage;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: PerPage) => void;
};

/**
 * ShifoReyting `.orgm-paginate` row — "X–Y / jami Z" info on the left,
 * per-page selector + first/prev/page-jump/next/last buttons on the
 * right. Page-jump input is editable so the user can type a number
 * and press Enter.
 */
export function TenantsPagination({
  page,
  totalPages,
  totalRows,
  perPage,
  onPageChange,
  onPerPageChange,
}: Props) {
  const [draft, setDraft] = useState(String(page));

  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  const start = totalRows === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(totalRows, page * perPage);

  const commit = (n: number) => {
    const clamped = Math.max(1, Math.min(totalPages, n));
    onPageChange(clamped);
  };

  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2.5 px-3.5 py-2.5 rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[12px]"
      aria-label="Tenant ro'yxati sahifalash"
    >
      <span className="text-[#62716d] dark:text-[#94a3b8] font-semibold">
        <strong className="text-[#16221f] dark:text-white font-extrabold tabular-nums">
          {start}
        </strong>
        –
        <strong className="text-[#16221f] dark:text-white font-extrabold tabular-nums">
          {end}
        </strong>{' '}
        / jami{' '}
        <strong className="text-[#16221f] dark:text-white font-extrabold tabular-nums">
          {totalRows}
        </strong>
      </span>
      <span className="hidden sm:block flex-1" aria-hidden="true" />
      <div className="flex items-center gap-2.5 flex-wrap">
        <label
          htmlFor="per-page-select"
          className="text-[#62716d] dark:text-[#94a3b8] text-[11px] font-semibold"
        >
          Sahifada:
        </label>
        <select
          id="per-page-select"
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value) as PerPage)}
          className="h-7 pl-2 pr-6 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[11px] font-semibold text-[#16221f] dark:text-white cursor-pointer outline-none focus-visible:border-[#0f766e] dark:focus-visible:border-[#14b8a6] focus-visible:ring-2 focus-visible:ring-[rgba(15,118,110,0.15)] dark:focus-visible:ring-[rgba(20,184,166,0.18)]"
        >
          {PER_PAGE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <PaginateButton onClick={() => commit(1)} disabled={page <= 1} title="Boshi">
          <ChevronsLeft className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
        </PaginateButton>
        <PaginateButton onClick={() => commit(page - 1)} disabled={page <= 1} title="Oldingi">
          <ChevronLeft className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
        </PaginateButton>
        <input
          type="number"
          value={draft}
          min={1}
          max={totalPages}
          aria-label={`Sahifa ${page}, jami ${totalPages}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(Number(draft) || 1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(Number(draft) || 1);
          }}
          className="w-11 h-7 px-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[11px] font-bold text-center text-[#16221f] dark:text-white tabular-nums outline-none focus-visible:border-[#0f766e] dark:focus-visible:border-[#14b8a6] focus-visible:ring-2 focus-visible:ring-[rgba(15,118,110,0.15)] dark:focus-visible:ring-[rgba(20,184,166,0.18)]"
        />
        <span className="text-[#62716d] dark:text-[#94a3b8] text-[11px] font-semibold">
          / <span className="tabular-nums">{totalPages}</span>
        </span>
        <PaginateButton onClick={() => commit(page + 1)} disabled={page >= totalPages} title="Keyingi">
          <ChevronRight className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
        </PaginateButton>
        <PaginateButton onClick={() => commit(totalPages)} disabled={page >= totalPages} title="Oxiri">
          <ChevronsRight className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
        </PaginateButton>
      </div>
    </nav>
  );
}

function PaginateButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'w-7 h-7 rounded-md border grid place-items-center transition-colors active:scale-95',
        'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#62716d] dark:text-[#94a3b8]',
        'hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#111827] disabled:hover:text-[#62716d] dark:disabled:hover:text-[#94a3b8] disabled:active:scale-100',
      )}
    >
      {children}
    </button>
  );
}
