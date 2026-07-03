import { Lock, type LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  locked?: boolean;
  lockedLabel?: string;
};

/**
 * Simple, calm placeholder for an upcoming report page. Matches the clean
 * "sodda + ixcham" pattern: title, description, neutral chip — no fake KPIs
 * or progress bars.
 */
export function ReportPlaceholder({
  icon: Icon,
  title,
  description,
  badge,
  locked = false,
  lockedLabel,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-semibold tracking-tight text-[#16221f] dark:text-white">
          {title}
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4f3] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#62716d] dark:bg-[#1a2235] dark:text-[#94a3b8]">
          {badge}
        </span>
        {locked && lockedLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Lock className="h-3 w-3" strokeWidth={2.4} />
            {lockedLabel}
          </span>
        ) : null}
      </div>

      <div className="flex items-start gap-4 rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-5 py-6 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-[#eef4f3] text-[#0f766e] dark:bg-[#1a2235] dark:text-teal-400">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <p className="text-sm leading-relaxed text-[#62716d] dark:text-[#94a3b8]">{description}</p>
      </div>
    </div>
  );
}
