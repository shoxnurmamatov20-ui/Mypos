'use client';

import { format, formatDistanceToNow } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, ArrowUpDown, Bot, Server, ShieldCheck, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SeverityBadge } from '@/components/dashboard/badges';
import type { AuditLogRecord } from '@/lib/api-helpers';
import { cn } from '@/lib/cn';
import type { AuditSeverity } from '@/types/super-admin';

export type SortColumn = 'timestamp' | 'severity';
export type SortDir = 'asc' | 'desc';
export type SortState = { column: SortColumn; dir: SortDir } | null;

type ActorType = AuditLogRecord['actor_type'];
type ApiSeverity = AuditLogRecord['severity'];

type Props = {
  rows: AuditLogRecord[];
  onRowClick: (entry: AuditLogRecord) => void;
  sort: SortState;
  onSortChange: (column: SortColumn) => void;
};

type ActorPresentation = {
  icon: LucideIcon;
  /** Tailwind classes for icon container background. */
  bg: string;
  /** Tailwind classes for icon stroke colour. */
  tint: string;
};

const ACTOR_PRESENTATION: Record<ActorType, ActorPresentation> = {
  user: {
    icon: User,
    bg: 'bg-blue-50 dark:bg-blue-500/15',
    tint: 'text-blue-600 dark:text-blue-400',
  },
  super_admin: {
    icon: ShieldCheck,
    bg: 'bg-teal-50 dark:bg-teal-500/15',
    tint: 'text-teal-700 dark:text-teal-400',
  },
  system: {
    icon: Server,
    bg: 'bg-gray-100 dark:bg-gray-800',
    tint: 'text-gray-500 dark:text-gray-400',
  },
  api: {
    icon: Bot,
    bg: 'bg-purple-50 dark:bg-purple-500/15',
    tint: 'text-purple-600 dark:text-purple-400',
  },
};

/** 3px left border per row, colour-coded by severity. */
const SEVERITY_BORDER: Record<ApiSeverity, string> = {
  debug: 'border-l-blue-400 dark:border-l-blue-500',
  info: 'border-l-blue-400 dark:border-l-blue-500',
  warning: 'border-l-amber-400 dark:border-l-amber-500',
  error: 'border-l-red-500 dark:border-l-red-500',
  critical: 'border-l-red-700 dark:border-l-red-400',
};

/** Translate API 5-level severity to the 4-level visual badge. */
function displaySeverity(s: ApiSeverity): AuditSeverity {
  return s === 'debug' ? 'info' : s;
}

/**
 * Audit log table. Desktop renders a sortable table; on mobile (<md)
 * rows collapse into stacked, tappable cards. Each row is keyboard
 * focusable (Enter/Space opens the detail modal) and carries a
 * severity-coloured 3px left border so the eye can scan critical
 * events instantly.
 */
export function AuditTable({ rows, onRowClick, sort, onSortChange }: Props) {
  const t = useTranslations('audit_page');
  const tSeverity = useTranslations('dashboard.severity');

  const handleRowKey = (entry: AuditLogRecord) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(entry);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((entry) => {
          const ts = new Date(entry.created_at);
          const actor = ACTOR_PRESENTATION[entry.actor_type];
          const ActorIcon = actor.icon;
          const sev = displaySeverity(entry.severity);

          return (
            <li
              key={entry.id}
              tabIndex={0}
              role="button"
              aria-label={`${t('view_details')}: ${entry.action}`}
              onClick={() => onRowClick(entry)}
              onKeyDown={handleRowKey(entry)}
              className={cn(
                'cursor-pointer transition-colors duration-150',
                'hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
                'border-l-[3px] px-3 py-3 space-y-2',
                SEVERITY_BORDER[entry.severity],
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums"
                  title={format(ts, 'yyyy-MM-dd HH:mm:ss')}
                >
                  {formatDistanceToNow(ts, { addSuffix: true })}
                </span>
                <SeverityBadge severity={sev} label={tSeverity(sev)} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                    actor.bg,
                    actor.tint,
                  )}
                  aria-hidden="true"
                >
                  <ActorIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {entry.actor_label ?? '—'}
                  </span>
                  <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                    {t(`actor_type_${entry.actor_type}`)}
                  </span>
                </span>
              </div>
              <code className="inline-block rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 px-1.5 py-0.5 font-mono text-[11px] text-gray-800 dark:text-gray-200">
                {entry.action}
              </code>
              {entry.subject_label ? (
                <p className="text-xs text-gray-900 dark:text-white truncate">
                  <span className="text-[10px] uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400 font-bold mr-1">
                    {entry.subject_type}:
                  </span>
                  {entry.subject_label}
                </p>
              ) : null}
              {entry.ip_address ? (
                <p className="font-mono text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                  {entry.ip_address}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px] text-[12.5px]">
          <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <SortableTh
                sort={sort}
                column="timestamp"
                onClick={() => onSortChange('timestamp')}
                label={t('sort_by', { col: t('th_timestamp') })}
              >
                {t('th_timestamp')}
              </SortableTh>
              <SortableTh
                sort={sort}
                column="severity"
                onClick={() => onSortChange('severity')}
                label={t('sort_by', { col: t('th_severity') })}
              >
                {t('th_severity')}
              </SortableTh>
              <Th>{t('th_actor')}</Th>
              <Th>{t('th_action')}</Th>
              <Th className="hidden lg:table-cell">{t('th_subject')}</Th>
              <Th className="hidden xl:table-cell">{t('th_ip')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((entry) => {
              const ts = new Date(entry.created_at);
              const actor = ACTOR_PRESENTATION[entry.actor_type];
              const ActorIcon = actor.icon;
              const sev = displaySeverity(entry.severity);

              return (
                <tr
                  key={entry.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${t('view_details')}: ${entry.action}`}
                  onClick={() => onRowClick(entry)}
                  onKeyDown={handleRowKey(entry)}
                  className={cn(
                    'cursor-pointer transition-colors duration-150',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
                    'border-l-[3px]',
                    SEVERITY_BORDER[entry.severity],
                  )}
                >
                  <td
                    className="px-3 py-2.5 text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap"
                    title={format(ts, 'yyyy-MM-dd HH:mm:ss')}
                  >
                    {formatDistanceToNow(ts, { addSuffix: true })}
                  </td>
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={sev} label={tSeverity(sev)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                          actor.bg,
                          actor.tint,
                        )}
                        aria-hidden="true"
                      >
                        <ActorIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white max-w-[180px]">
                          {entry.actor_label ?? '—'}
                        </span>
                        <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                          {t(`actor_type_${entry.actor_type}`)}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="inline-block rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 px-1.5 py-0.5 font-mono text-[11px] text-gray-800 dark:text-gray-200">
                      {entry.action}
                    </code>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    {entry.subject_label ? (
                      <span className="block min-w-0">
                        <span className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.04em] font-bold">
                          {entry.subject_type}
                        </span>
                        <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white max-w-[220px]">
                          {entry.subject_label}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums hidden xl:table-cell">
                    {entry.ip_address ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ThProps = {
  children: React.ReactNode;
  className?: string;
};

function Th({ children, className }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400 whitespace-nowrap select-none',
        className,
      )}
    >
      {children}
    </th>
  );
}

function SortableTh({
  sort,
  column,
  onClick,
  label,
  children,
}: {
  sort: SortState;
  column: SortColumn;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const isSorted = sort?.column === column;
  const dir = sort?.dir;
  const SortIcon = !isSorted ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={isSorted ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400 whitespace-nowrap select-none"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'inline-flex items-center gap-1 -mx-1 px-1 py-0.5 rounded',
          'transition-colors duration-150',
          'hover:text-gray-900 dark:hover:text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        )}
      >
        <span>{children}</span>
        <SortIcon
          className={cn(
            'h-3 w-3 transition-opacity',
            isSorted ? 'text-teal-700 dark:text-teal-400 opacity-100' : 'opacity-50',
          )}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}
