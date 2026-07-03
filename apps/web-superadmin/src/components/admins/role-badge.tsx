import { cn } from '@/lib/cn';
import type { SuperAdminRole } from '@/stores/auth';

/**
 * Coloured pill for super-admin roles. The palette matches the design
 * spec: owner=purple (highest authority), admin=blue, support=teal
 * (brand accent), finance=amber, developer=gray. Light + dark variants
 * are spelled out explicitly so Tailwind's content scanner can keep
 * them in the build.
 */
const ROLE_STYLES: Record<SuperAdminRole, string> = {
  owner:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  admin:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  support:
    'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
  finance:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  developer:
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30',
};

const PILL_BASE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight whitespace-nowrap';

type Size = 'sm' | 'md';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'text-[10px] px-2 py-[1px]',
  md: 'text-xs px-2.5 py-0.5',
};

export function RoleBadge({
  role,
  label,
  size = 'md',
}: {
  role: SuperAdminRole;
  label: string;
  size?: Size;
}) {
  return <span className={cn(PILL_BASE, SIZE_CLASS[size], ROLE_STYLES[role])}>{label}</span>;
}
