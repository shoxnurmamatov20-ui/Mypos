import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Accent = 'amber' | 'blue' | 'emerald' | 'red' | 'orange' | 'violet' | 'slate' | 'teal';

const ACCENTS: Record<Accent, { ring: string; iconBg: string; iconText: string }> = {
  amber: { ring: 'ring-amber-100', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
  blue: { ring: 'ring-blue-100', iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
  emerald: { ring: 'ring-emerald-100', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
  red: { ring: 'ring-red-100', iconBg: 'bg-red-50', iconText: 'text-red-600' },
  orange: { ring: 'ring-orange-100', iconBg: 'bg-orange-50', iconText: 'text-orange-600' },
  violet: { ring: 'ring-violet-100', iconBg: 'bg-violet-50', iconText: 'text-violet-600' },
  slate: { ring: 'ring-slate-100', iconBg: 'bg-slate-50', iconText: 'text-slate-600' },
  teal: { ring: 'ring-teal-100', iconBg: 'bg-teal-50', iconText: 'text-teal-600' },
};

export function StatTile({
  accent,
  icon: Icon,
  label,
  value,
  decimals = 0,
}: {
  accent: Accent;
  icon: LucideIcon;
  label: string;
  value: number;
  decimals?: number;
}) {
  const a = ACCENTS[accent];
  const formatted = value.toLocaleString('uz-UZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div
      className={cn(
        'rounded-xl border bg-white dark:bg-[#111827] p-3 transition-colors',
        'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center ring-1 dark:ring-0',
            a.iconBg,
            a.ring,
            'dark:bg-[#1a2235]',
          )}
        >
          <Icon className={cn('w-3.5 h-3.5', a.iconText, 'dark:opacity-90')} strokeWidth={2.2} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] truncate">
          {label}
        </p>
      </div>
      <p className="mt-2 text-[22px] font-black tabular-nums text-[#16221f] dark:text-white">
        {formatted}
      </p>
    </div>
  );
}
