'use client';

import { formatDistanceToNow } from 'date-fns';
import { type LucideIcon, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminUserRecord } from '@/lib/api-helpers';
import { cn } from '@/lib/cn';
import type { SuperAdminRole } from '@/stores/auth';
import { RoleBadge } from './role-badge';

type Props = {
  rows: AdminUserRecord[];
  /** Current user uuid — disables destructive actions on self. */
  currentUserId: string | null;
  onRevoke: (admin: AdminUserRecord) => void;
  isRevoking?: boolean;
};

/** Avatar gradient tied to the admin's role so the table reads at a glance. */
const ROLE_AVATAR: Record<SuperAdminRole, string> = {
  owner: 'from-purple-500 to-purple-700',
  admin: 'from-blue-500 to-blue-700',
  support: 'from-teal-500 to-teal-700',
  finance: 'from-amber-500 to-amber-700',
  developer: 'from-gray-500 to-gray-700',
};

/** Identifier used by the mutate helpers — backend expects uuid, not internal id. */
function adminUuid(admin: AdminUserRecord): string {
  return admin.uuid ?? admin.id;
}

/** True when the admin logged in within the last 24 hours. */
function isOnline(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}

/** Stable two-letter initial from a full name (or email fallback). */
function pickInitial(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0]! + parts[1][0]!).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/** API records use a nullable super_admin_role; fall back to `support`. */
function resolvedRole(admin: AdminUserRecord): SuperAdminRole {
  return (admin.super_admin_role ?? 'support') as SuperAdminRole;
}

/**
 * Active super admins table. Each row carries a role-coloured avatar
 * with two-letter initial, an online dot indicator, role pill, 2FA
 * status, last-login relative time, and a single Revoke action — the
 * only mutation the API currently exposes. On mobile (<md) the table
 * collapses into stacked cards.
 */
export function ActiveAdminsTable({ rows, currentUserId, onRevoke, isRevoking = false }: Props) {
  const t = useTranslations('admins_page');

  if (rows.length === 0) {
    // The view-level empty state handles the no-data case more richly,
    // but defensively render a small fallback here if we're embedded
    // somewhere that didn't gate on length.
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Mobile cards */}
      <ul className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((admin) => {
          const isSelf = adminUuid(admin) === currentUserId || admin.id === currentUserId;
          const role = resolvedRole(admin);
          const initial = pickInitial(admin.name, admin.email);
          const online = isOnline(admin.last_super_admin_login_at);
          return (
            <li key={admin.id} className="px-4 py-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <Avatar
                  initial={initial}
                  role={role}
                  online={online}
                  size="md"
                  onlineLabel={t('status_active')}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {admin.name}
                    {isSelf ? <SelfTag label={t('self_tag')} /> : null}
                  </p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {admin.email}
                  </p>
                </div>
                <RoleBadge role={role} label={t(`role_${role}`)} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <MfaBadge enabled={admin.mfa_enabled} t={t} />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums truncate">
                    {admin.last_super_admin_login_at
                      ? formatDistanceToNow(new Date(admin.last_super_admin_login_at), {
                          addSuffix: true,
                        })
                      : '—'}
                  </span>
                </div>
                <RowAction
                  icon={Trash2}
                  ariaLabel={
                    isSelf ? t('cannot_self_revoke') : `${t('action_revoke')}: ${admin.name}`
                  }
                  onClick={() => onRevoke(admin)}
                  disabled={isSelf || role === 'owner' || isRevoking}
                  danger
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <Th>{t('th_admin')}</Th>
              <Th>{t('th_role')}</Th>
              <Th className="hidden lg:table-cell">{t('th_mfa')}</Th>
              <Th className="hidden lg:table-cell">{t('th_last_login')}</Th>
              <Th align="right">{t('th_actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((admin) => {
              const isSelf = adminUuid(admin) === currentUserId || admin.id === currentUserId;
              const role = resolvedRole(admin);
              const initial = pickInitial(admin.name, admin.email);
              const online = isOnline(admin.last_super_admin_login_at);
              return (
                <tr
                  key={admin.id}
                  className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <Avatar
                        initial={initial}
                        role={role}
                        online={online}
                        size="sm"
                        onlineLabel={t('status_active')}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white max-w-[220px]">
                          {admin.name}
                          {isSelf ? <SelfTag label={t('self_tag')} /> : null}
                        </span>
                        <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {admin.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <RoleBadge role={role} label={t(`role_${role}`)} />
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <MfaBadge enabled={admin.mfa_enabled} t={t} />
                  </td>
                  <td
                    className="px-3 py-2.5 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap hidden lg:table-cell"
                    title={admin.last_super_admin_login_at ?? undefined}
                  >
                    {admin.last_super_admin_login_at
                      ? formatDistanceToNow(new Date(admin.last_super_admin_login_at), {
                          addSuffix: true,
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <RowAction
                      icon={Trash2}
                      ariaLabel={
                        isSelf ? t('cannot_self_revoke') : `${t('action_revoke')}: ${admin.name}`
                      }
                      onClick={() => onRevoke(admin)}
                      disabled={isSelf || role === 'owner' || isRevoking}
                      danger
                    />
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

// ─── Subcomponents ────────────────────────────────────────────────────

type AvatarProps = {
  initial: string;
  role: SuperAdminRole;
  online: boolean;
  size: 'sm' | 'md';
  onlineLabel: string;
};

function Avatar({ initial, role, online, size, onlineLabel }: AvatarProps) {
  const dim = size === 'sm' ? 'h-8 w-8 text-[12px]' : 'h-9 w-9 text-sm';
  return (
    <span className="relative shrink-0">
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br text-white font-bold tabular-nums leading-none',
          dim,
          ROLE_AVATAR[role],
        )}
      >
        {initial}
      </span>
      {online ? (
        <span
          aria-label={onlineLabel}
          title={onlineLabel}
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"
        />
      ) : null}
    </span>
  );
}

function SelfTag({ label }: { label: string }) {
  return (
    <span className="ml-1.5 align-middle text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-[0.04em]">
      {label}
    </span>
  );
}

function MfaBadge({ enabled, t }: { enabled: boolean; t: ReturnType<typeof useTranslations> }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
      <Shield className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
      <span className="whitespace-nowrap">{t('mfa_enabled')}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
      <ShieldOff className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
      <span className="whitespace-nowrap">{t('mfa_disabled')}</span>
    </span>
  );
}

type RowActionProps = {
  icon: LucideIcon;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function RowAction({
  icon: Icon,
  ariaLabel,
  onClick,
  disabled = false,
  danger = false,
}: RowActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-md',
        'border bg-white dark:bg-gray-900',
        'border-gray-200 dark:border-gray-800',
        'text-gray-500 dark:text-gray-400',
        'transition-colors duration-150',
        danger
          ? 'hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'hover:text-gray-900 dark:hover:text-white hover:border-teal-300 dark:hover:border-teal-500/40 hover:bg-teal-50 dark:hover:bg-teal-500/15',
        'active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800',
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

type ThProps = {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
};

function Th({ children, align = 'left', className }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400 whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}
