import { cn } from '../cn';
import { Button } from './button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;
  total?: number;
  perPage?: number;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
  showInfo = true,
  total,
  perPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = perPage && total ? Math.min((page - 1) * perPage + 1, total) : null;
  const to = perPage && total ? Math.min(page * perPage, total) : null;

  const range: (number | 'ellipsis')[] = [];
  const max = totalPages;
  if (max <= 7) {
    for (let i = 1; i <= max; i++) range.push(i);
  } else {
    range.push(1);
    if (page > 4) range.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(max - 1, page + 1);
    for (let i = start; i <= end; i++) range.push(i);
    if (page < max - 3) range.push('ellipsis');
    range.push(max);
  }

  return (
    <div className={cn('mt-4 flex items-center justify-between gap-3 flex-wrap', className)}>
      {showInfo && from && to && total ? (
        <p className="text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
          {from}–{to} / {total}
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          ←
        </Button>
        {range.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-2 text-[#62716d] dark:text-[#94a3b8] text-[12px]">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                'h-8 min-w-[32px] px-2 rounded-md text-[12px] font-semibold transition-colors',
                item === page
                  ? 'bg-[#0f766e] text-white dark:bg-[#14b8a6]'
                  : 'text-[#16221f] dark:text-white hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
              )}
            >
              {item}
            </button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          →
        </Button>
      </div>
    </div>
  );
}
