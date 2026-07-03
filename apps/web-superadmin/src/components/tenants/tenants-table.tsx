'use client';

import type { Locale } from 'date-fns';
import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';
import { Eye, Inbox, LogIn, type LucideIcon, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { formatCompactNumber, formatUZS } from '@/lib/format';
import { pickAvatarColor } from '@/lib/tenant-utils';
import type { TenantStatus, TenantSummary } from '@/types/super-admin';
import type { TenantAction } from './tenant-action-menu';
import { TenantPlanBadge } from './tenant-plan-badge';
import { TenantStatusBadge } from './tenant-status-badge';

export type SortColumn = 'name' | 'mrr' | 'orders' | 'rating' | 'created' | 'last_active';
export type SortDir = 'asc' | 'desc';
export type SortState = { column: SortColumn; dir: SortDir } | null;

type Props = {
  rows: readonly TenantSummary[];
  locale: string;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: (next: boolean) => void;
  onAction: (action: TenantAction, tenant: TenantSummary) => void;
  sort: SortState;
  onSortChange: (column: SortColumn) => void;
};

const DATE_FNS_LOCALE: Record<string, Locale> = { uz, ru, en: enUS };

/**
 * Tenants table — desktop renders a himoya `.orgm-table` with compact
 * 26px avatars and sortable headers. On xs/sm we render a card list
 * instead, since the action column doesn't fit on phones; on md+ we
 * switch to the full table view.
 */
export function TenantsTable({
  rows,
  locale,
  selected,
  onToggle,
  onToggleAll,
  onAction,
  sort,
  onSortChange,
}: Props) {
  const t = useTranslations('tenants_page');
  const router = useRouter();
  const dateFnsLocale = DATE_FNS_LOCALE[locale] ?? enUS;

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = !allChecked && rows.some((r) => selected.has(r.id));

  const formatRelative = useMemo(
    () => (iso: string | null) => {
      if (!iso) return t('never_active');
      try {
        return formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: dateFnsLocale });
      } catch {
        return '—';
      }
    },
    [dateFnsLocale, t],
  );

  const formatCreated = (iso: string): string =>
    new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] overflow-hidden">
      {rows.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <Inbox
            className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-[#16221f] dark:text-white">
            Hech narsa topilmadi
          </p>
          <p className="mt-1 text-xs text-[#62716d] dark:text-[#94a3b8]">
            Filtrlarni o&apos;zgartirib qayta urinib ko&apos;ring
          </p>
        </div>
      ) : (
        <>
          {/* Mobile (xs/sm): card list */}
          <ul className="md:hidden divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
            {rows.map((row) => (
              <MobileRow
                key={row.id}
                row={row}
                locale={locale}
                isSelected={selected.has(row.id)}
                onToggle={onToggle}
                onAction={onAction}
                formatRelative={formatRelative}
              />
            ))}
          </ul>

          {/* Desktop (md+): full table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] min-w-[720px]">
              <thead className="bg-[#eef4f3] dark:bg-[#1a2235]">
                <tr>
                  <th scope="col" className="w-8 pl-3.5 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={t('select_all')}
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={(e) => onToggleAll(e.target.checked)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-[rgba(22,34,31,0.20)] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#1a2235] text-[#0f766e] focus:ring-2 focus:ring-[rgba(15,118,110,0.20)]"
                    />
                  </th>
                  <SortableTh sort={sort} column="name" onClick={() => onSortChange('name')}>
                    Tenant
                  </SortableTh>
                  <Th>Egasi</Th>
                  <Th>Tarif</Th>
                  <Th>Holat</Th>
                  <SortableTh
                    sort={sort}
                    column="mrr"
                    onClick={() => onSortChange('mrr')}
                    align="right"
                  >
                    MRR
                  </SortableTh>
                  <SortableTh
                    sort={sort}
                    column="orders"
                    onClick={() => onSortChange('orders')}
                    align="right"
                  >
                    Buyurtma
                  </SortableTh>
                  <SortableTh
                    sort={sort}
                    column="created"
                    onClick={() => onSortChange('created')}
                    className="hidden lg:table-cell"
                  >
                    Yaratilgan
                  </SortableTh>
                  <SortableTh
                    sort={sort}
                    column="last_active"
                    onClick={() => onSortChange('last_active')}
                    className="hidden xl:table-cell"
                  >
                    Oxirgi faollik
                  </SortableTh>
                  <th
                    scope="col"
                    className="w-[140px] pr-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-[#62716d] dark:text-[#94a3b8]"
                  >
                    Amal
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <DesktopRow
                    key={row.id}
                    row={row}
                    locale={locale}
                    isSelected={selected.has(row.id)}
                    onToggle={onToggle}
                    onAction={onAction}
                    formatCreated={formatCreated}
                    formatRelative={formatRelative}
                    router={router}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function DesktopRow({
  row,
  locale,
  isSelected,
  onToggle,
  onAction,
  formatCreated,
  formatRelative,
  router,
}: {
  row: TenantSummary;
  locale: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onAction: (action: TenantAction, tenant: TenantSummary) => void;
  formatCreated: (iso: string) => string;
  formatRelative: (iso: string | null) => string;
  router: ReturnType<typeof useRouter>;
}) {
  const initial = row.name.trim().charAt(0).toUpperCase() || '?';
  const inactive: TenantStatus[] = ['suspended', 'cancelled'];
  const isInactive = inactive.includes(row.status);

  return (
    <tr
      onClick={() => router.push(`/${locale}/tenants/${row.id}` as Route)}
      className={cn(
        'cursor-pointer transition-colors border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.06)]',
        isSelected
          ? 'bg-[rgba(15,118,110,0.08)] dark:bg-[rgba(20,184,166,0.10)]'
          : 'hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
        isInactive && 'opacity-60',
      )}
    >
      <td className="pl-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          aria-label={`${row.name}ni tanlash`}
          checked={isSelected}
          onChange={() => onToggle(row.id)}
          className="h-3.5 w-3.5 cursor-pointer rounded border-[rgba(22,34,31,0.20)] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#1a2235] text-[#0f766e] focus:ring-2 focus:ring-[rgba(15,118,110,0.20)]"
        />
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold text-white',
              pickAvatarColor(row.slug),
            )}
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#16221f] dark:text-white truncate max-w-[220px]">
              {row.name}
            </div>
            <div className="text-[10px] font-medium text-[#62716d] dark:text-[#94a3b8] truncate">
              {row.slug}
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 text-[11px]">
        <div className="text-[#16221f] dark:text-white font-semibold truncate max-w-[180px]">
          {row.owner_name || '—'}
        </div>
        <div className="text-[#62716d] dark:text-[#94a3b8] truncate max-w-[180px]">
          {row.owner_email || '—'}
        </div>
      </td>

      <td className="px-3 py-2.5">
        <TenantPlanBadge plan={row.plan} />
      </td>

      <td className="px-3 py-2.5">
        <TenantStatusBadge status={row.status} />
      </td>

      <td className="px-3 py-2.5 text-right font-bold text-[12.5px] text-[#16221f] dark:text-white tabular-nums">
        {row.mrr_minor > 0 ? formatUZS(row.mrr_minor) : '—'}
      </td>

      <td className="px-3 py-2.5 text-right font-bold text-[12.5px] text-[#16221f] dark:text-white tabular-nums">
        {formatCompactNumber(row.total_orders_count)}
      </td>

      <td className="px-3 py-2.5 hidden lg:table-cell text-[11px] text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap">
        {formatCreated(row.created_at)}
      </td>

      <td className="px-3 py-2.5 hidden xl:table-cell text-[11px] text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap">
        {formatRelative(row.last_active_at)}
      </td>

      <td
        className="pr-3.5 py-2.5 text-right whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <RowAction icon={Eye} title="Ko'rish" onClick={() => onAction('view', row)} />
        <RowAction
          icon={LogIn}
          title="Tizimga kirish"
          onClick={() => onAction('impersonate', row)}
        />
        {row.status === 'suspended' ? (
          <RowAction
            icon={PlayCircle}
            title="Faollashtirish"
            onClick={() => onAction('resume', row)}
          />
        ) : (
          <RowAction
            icon={PauseCircle}
            title="To'xtatish"
            onClick={() => onAction('suspend', row)}
          />
        )}
        <RowAction icon={Trash2} title="O'chirish" danger onClick={() => onAction('delete', row)} />
      </td>
    </tr>
  );
}

function MobileRow({
  row,
  locale,
  isSelected,
  onToggle,
  onAction,
  formatRelative,
}: {
  row: TenantSummary;
  locale: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onAction: (action: TenantAction, tenant: TenantSummary) => void;
  formatRelative: (iso: string | null) => string;
}) {
  const router = useRouter();
  const initial = row.name.trim().charAt(0).toUpperCase() || '?';
  const inactive: TenantStatus[] = ['suspended', 'cancelled'];
  const isInactive = inactive.includes(row.status);

  return (
    <li
      className={cn(
        'px-3.5 py-3 transition-colors',
        isSelected
          ? 'bg-[rgba(15,118,110,0.08)] dark:bg-[rgba(20,184,166,0.10)]'
          : 'hover:bg-[#eef4f3]/60 dark:hover:bg-[#1a2235]/60',
        isInactive && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          aria-label={`${row.name}ni tanlash`}
          checked={isSelected}
          onChange={() => onToggle(row.id)}
          className="mt-1 h-3.5 w-3.5 cursor-pointer rounded border-[rgba(22,34,31,0.20)] dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#1a2235] text-[#0f766e] focus:ring-2 focus:ring-[rgba(15,118,110,0.20)]"
        />
        <button
          type="button"
          onClick={() => router.push(`/${locale}/tenants/${row.id}` as Route)}
          className="flex items-start gap-3 flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827] rounded"
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-white',
              pickAvatarColor(row.slug),
            )}
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#16221f] dark:text-white truncate">
              {row.name}
            </p>
            <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate">{row.slug}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <TenantPlanBadge plan={row.plan} />
              <TenantStatusBadge status={row.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
              {row.mrr_minor > 0 ? (
                <span className="text-[#16221f] dark:text-white font-bold tabular-nums">
                  {formatUZS(row.mrr_minor)}
                </span>
              ) : null}
              <span className="tabular-nums">
                {formatCompactNumber(row.total_orders_count)} buyurtma
              </span>
              <span>{formatRelative(row.last_active_at)}</span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5">
        <RowAction icon={Eye} title="Ko'rish" onClick={() => onAction('view', row)} />
        <RowAction
          icon={LogIn}
          title="Tizimga kirish"
          onClick={() => onAction('impersonate', row)}
        />
        {row.status === 'suspended' ? (
          <RowAction
            icon={PlayCircle}
            title="Faollashtirish"
            onClick={() => onAction('resume', row)}
          />
        ) : (
          <RowAction
            icon={PauseCircle}
            title="To'xtatish"
            onClick={() => onAction('suspend', row)}
          />
        )}
        <RowAction icon={Trash2} title="O'chirish" danger onClick={() => onAction('delete', row)} />
      </div>
    </li>
  );
}

function RowAction({
  icon: Icon,
  title,
  onClick,
  danger = false,
}: {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'inline-grid place-items-center w-7 h-7 md:w-6 md:h-6 ml-0 md:ml-1 rounded-[5px] border bg-white dark:bg-[#111827] text-[#62716d] dark:text-[#94a3b8] transition-colors active:scale-95',
        'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]',
        danger
          ? 'hover:text-[#b42318] dark:hover:text-[#f87171] hover:border-[rgba(239,68,68,0.40)]'
          : 'hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white hover:border-[rgba(15,118,110,0.30)] dark:hover:border-[rgba(20,184,166,0.30)]',
      )}
    >
      <Icon className="w-3.5 h-3.5 md:w-3 md:h-3" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap select-none',
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
  align = 'left',
  className,
  children,
}: {
  sort: SortState;
  column: SortColumn;
  onClick: () => void;
  align?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}) {
  const isSorted = sort?.column === column;
  const dir = sort?.dir;
  return (
    <th
      scope="col"
      aria-sort={isSorted ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#62716d] dark:text-[#94a3b8] whitespace-nowrap select-none cursor-pointer transition-colors',
        'hover:text-[#16221f] dark:hover:text-white',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
      <span
        className={cn(
          'inline-block w-2 ml-1',
          isSorted ? 'text-[#0f766e] dark:text-[#14b8a6] opacity-100' : 'opacity-40',
        )}
        aria-hidden="true"
      >
        {isSorted ? (dir === 'asc' ? '▲' : '▼') : '▾'}
      </span>
    </th>
  );
}
