import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading = false,
  empty,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
        'bg-white dark:bg-[#111827]',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead
            className={cn(
              'border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
              'bg-[#f8fafc] dark:bg-[#0f172a]',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    'px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#62716d] dark:text-[#94a3b8]',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[#62716d] dark:text-[#94a3b8]"
                >
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#0f766e] border-t-transparent" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-[#62716d] dark:text-[#94a3b8]"
                >
                  {empty ?? '—'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        'px-4 py-3 text-[13px] text-[#16221f] dark:text-[#e2e8f0]',
                        col.align === 'right' && 'text-right tabular-nums',
                        col.align === 'center' && 'text-center',
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
