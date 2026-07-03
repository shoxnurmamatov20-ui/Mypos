import { cn } from '@/lib/cn';
import type { AuditSeverity, TenantPlan, TenantStatus } from '@/types/super-admin';

/**
 * Pill badges — himoya/ShifoReyting palette. Each row has light + dark
 * variants spelled out so Tailwind's content scanner picks them up.
 * Used in audit, subscriptions, and impersonate-tagged surfaces.
 */
const PLAN_STYLES: Record<TenantPlan, string> = {
  free: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  starter:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  pro: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  plus: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  business:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  enterprise:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
};

const STATUS_STYLES: Record<TenantStatus, string> = {
  active:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  trialing:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  past_due:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  suspended:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  cancelled:
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  error:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  critical:
    'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/25 dark:text-red-200 dark:border-red-500/50',
};

const PILL_BASE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold';

export function PlanBadge({ plan, label }: { plan: TenantPlan; label: string }) {
  return <span className={cn(PILL_BASE, PLAN_STYLES[plan])}>{label}</span>;
}

export function StatusBadge({ status, label }: { status: TenantStatus; label: string }) {
  return (
    <span className={cn(PILL_BASE, 'gap-1.5', STATUS_STYLES[status])}>
      {status === 'active' ? (
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"
          aria-hidden="true"
        />
      ) : null}
      {label}
    </span>
  );
}

export function SeverityBadge({ severity, label }: { severity: AuditSeverity; label: string }) {
  return <span className={cn(PILL_BASE, SEVERITY_STYLES[severity])}>{label}</span>;
}
