'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  CircleSlash,
  Clock,
  Trash2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { InvitationRecord } from '@/lib/api-helpers';
import type { SuperAdminRole } from '@/stores/auth';
import { RoleBadge } from './role-badge';

type InvitationStatus = 'pending' | 'expired' | 'accepted' | 'revoked';

type Props = {
  rows: InvitationRecord[];
  onRevoke: (invitation: InvitationRecord) => void;
  isRevoking?: boolean;
};

type StatusPresentation = {
  styles: string;
  icon: LucideIcon;
};

const STATUS_PRESENTATION: Record<InvitationStatus, StatusPresentation> = {
  pending: {
    styles:
      'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30',
    icon: Clock,
  },
  expired: {
    styles:
      'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
    icon: XCircle,
  },
  accepted: {
    styles:
      'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
    icon: CheckCircle2,
  },
  revoked: {
    styles:
      'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:ring-gray-500/30',
    icon: CircleSlash,
  },
};

/** Derive a single status enum from the API record's boolean+date fields. */
function statusOf(invitation: InvitationRecord): InvitationStatus {
  if (invitation.revoked_at) return 'revoked';
  if (invitation.accepted_at) return 'accepted';
  if (new Date(invitation.expires_at).getTime() < Date.now()) return 'expired';
  return 'pending';
}

/** API responses carry the desired role in metadata.role; fall back to `support`. */
function roleOf(invitation: InvitationRecord): SuperAdminRole {
  const role = invitation.metadata?.role as SuperAdminRole | undefined;
  return role ?? 'support';
}

/** Returns the countdown class — gets warmer as expiry approaches. */
function expiryTint(status: InvitationStatus, expiresAt: string): string {
  if (status !== 'pending') return 'text-gray-500 dark:text-gray-400';
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  const days = remainingMs / (1000 * 60 * 60 * 24);
  if (days < 1) return 'text-red-700 dark:text-red-400 font-semibold';
  if (days < 3) return 'text-amber-700 dark:text-amber-400 font-semibold';
  return 'text-gray-500 dark:text-gray-400';
}

/**
 * Pending / expired invitation rows. Pending rows expose a countdown
 * ("expires in 3 days") that gets visually warmer (amber → red) as the
 * deadline approaches. On mobile (<md) rows collapse into stacked cards.
 */
export function InvitationsTable({ rows, onRevoke, isRevoking = false }: Props) {
  const t = useTranslations('admins_page');

  if (rows.length === 0) {
    // The view-level empty state handles the no-data case; defensive fallback.
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Mobile cards */}
      <ul className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((invitation) => {
          const status = statusOf(invitation);
          const role = roleOf(invitation);
          return (
            <li key={invitation.id} className="px-4 py-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {invitation.email}
                </p>
                <StatusChip status={status} label={t(invitationStatusKey(status))} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={role} label={t(`role_${role}`)} />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                  {formatDistanceToNow(new Date(invitation.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <ExpiryLabel
                  status={status}
                  expiresAt={invitation.expires_at}
                  expiresInLabel={t('expires_in')}
                  expiredLabel={t('expired_label')}
                />
                {status === 'pending' ? (
                  <RowAction
                    icon={Trash2}
                    ariaLabel={`${t('action_revoke')}: ${invitation.email}`}
                    onClick={() => onRevoke(invitation)}
                    danger
                    disabled={isRevoking}
                  />
                ) : null}
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
              <Th>{t('th_email')}</Th>
              <Th>{t('th_role')}</Th>
              <Th className="hidden lg:table-cell">{t('th_sent')}</Th>
              <Th className="hidden lg:table-cell">{t('th_expires')}</Th>
              <Th>{t('th_invitation_status')}</Th>
              <Th align="right">{t('th_actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                onRevoke={onRevoke}
                isRevoking={isRevoking}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function invitationStatusKey(status: InvitationStatus): string {
  return `invitation_status_${status === 'revoked' ? 'expired' : status}` as const;
}

function InvitationRow({
  invitation,
  onRevoke,
  isRevoking,
}: {
  invitation: InvitationRecord;
  onRevoke: (i: InvitationRecord) => void;
  isRevoking: boolean;
}) {
  const t = useTranslations('admins_page');
  const status = statusOf(invitation);
  const role = roleOf(invitation);
  const tint = expiryTint(status, invitation.expires_at);

  return (
    <tr className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60">
      <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-white max-w-[260px] truncate">
        {invitation.email}
      </td>
      <td className="px-3 py-2.5">
        <RoleBadge role={role} label={t(`role_${role}`)} />
      </td>
      <td className="px-3 py-2.5 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap hidden lg:table-cell">
        {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap hidden lg:table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
            {format(new Date(invitation.expires_at), 'dd.MM.yyyy')}
          </span>
          <span className={cn('text-[10px] tabular-nums', tint)}>
            {status === 'pending'
              ? `${t('expires_in')} ${formatDistanceToNow(new Date(invitation.expires_at))}`
              : status === 'expired'
                ? t('expired_label')
                : null}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <StatusChip status={status} label={t(invitationStatusKey(status))} />
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {status === 'pending' ? (
          <RowAction
            icon={Trash2}
            ariaLabel={`${t('action_revoke')}: ${invitation.email}`}
            onClick={() => onRevoke(invitation)}
            danger
            disabled={isRevoking}
          />
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-[11px]" aria-hidden="true">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

type StatusChipProps = {
  status: InvitationStatus;
  label: string;
};

function StatusChip({ status, label }: StatusChipProps) {
  const { styles, icon: Icon } = STATUS_PRESENTATION[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] leading-tight whitespace-nowrap',
        styles,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

type ExpiryLabelProps = {
  status: InvitationStatus;
  expiresAt: string;
  expiresInLabel: string;
  expiredLabel: string;
};

function ExpiryLabel({ status, expiresAt, expiresInLabel, expiredLabel }: ExpiryLabelProps) {
  const tint = expiryTint(status, expiresAt);
  if (status === 'pending') {
    return (
      <span className={cn('text-[11px] tabular-nums', tint)}>
        {expiresInLabel} {formatDistanceToNow(new Date(expiresAt))}
      </span>
    );
  }
  if (status === 'expired') {
    return <span className="text-[11px] text-amber-700 dark:text-amber-400">{expiredLabel}</span>;
  }
  return (
    <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
      {format(new Date(expiresAt), 'dd.MM.yyyy')}
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
        'disabled:opacity-40 disabled:cursor-not-allowed',
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
