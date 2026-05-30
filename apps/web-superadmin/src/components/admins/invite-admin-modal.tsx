'use client';

import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@mypos/api-client';
import { AlertCircle, AlertTriangle, Check, Copy, Mail, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import { inviteAdmin, type InvitationRecord } from '@/lib/api-helpers';
import type { SuperAdminRole } from '@/stores/auth';
import { RoleBadge } from './role-badge';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful invitation creation — used to invalidate queries. */
  onCreated?: (invitation: InvitationRecord) => void;
};

type InviteRole = Exclude<SuperAdminRole, 'owner'>;

type FormState = {
  email: string;
  name: string;
  role: InviteRole;
};

const ROLES: readonly InviteRole[] = ['admin', 'support', 'finance', 'developer'];
const INITIAL: FormState = { email: '', name: '', role: 'support' };

/** RFC-lite email check that mirrors the backend FormRequest rule. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invitation creation modal. Two-step flow: form → success state with
 * the one-time invitation token. Inline email validation feedback,
 * role picker with descriptions, and an explicit "show once" warning
 * over the token reveal.
 */
export function InviteAdminModal({ open, onClose, onCreated }: Props) {
  const t = useTranslations('admins_page');
  const tCommon = useTranslations('common');

  const [form, setForm] = useState<FormState>(INITIAL);
  const [emailTouched, setEmailTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: inviteAdmin,
    onSuccess: (response) => {
      setToken(response.token);
      onCreated?.(response.invitation);
    },
  });

  useEffect(() => {
    if (!open) {
      setForm(INITIAL);
      setEmailTouched(false);
      setValidationError(null);
      setToken(null);
      setCopied(false);
      inviteMutation.reset();
    }
    // intentionally only react to `open` to avoid resetting mid-flight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Live email validation — only renders feedback once the field has been touched.
  const emailLiveError = useMemo<string | null>(() => {
    if (!emailTouched) return null;
    const trimmed = form.email.trim();
    if (!trimmed) return t('validation_email_required');
    if (!EMAIL_RE.test(trimmed)) return t('validation_email_format');
    return null;
  }, [emailTouched, form.email, t]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    setEmailTouched(true);

    const email = form.email.trim();
    if (!email) {
      setValidationError(t('validation_email_required'));
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setValidationError(t('validation_email_format'));
      return;
    }

    inviteMutation.mutate({
      email,
      role: form.role,
      name: form.name.trim() || undefined,
    });
  };

  const copyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API blocked (rare in dev) — fail silently.
    }
  };

  const submitting = inviteMutation.isPending;
  const apiError =
    inviteMutation.error instanceof ApiError
      ? ((inviteMutation.error.body as { message?: string } | undefined)?.message ??
        inviteMutation.error.message)
      : inviteMutation.error
        ? (inviteMutation.error as Error).message
        : null;
  // Show submission errors only; live inline errors are rendered next to the field.
  const submitError = validationError ?? apiError;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={token ? t('invite_success_title') : t('invite_modal_title')}
      description={token ? t('invite_success_subtitle') : t('invite_modal_subtitle')}
      size="md"
    >
      {token ? (
        <div className="space-y-5">
          {/* "Show only once" warning banner */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle
              className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                {t('invite_token_warning_title')}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                {t('invite_token_warning_body')}
              </p>
            </div>
          </div>

          {/* Token reveal */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3">
            <p className="break-all font-mono text-xs text-gray-900 dark:text-gray-100 leading-relaxed tabular-nums">
              {token}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={copyToken}
              className={cn(
                'inline-flex items-center justify-center gap-2 h-10 rounded-md px-4',
                'bg-teal-700 hover:bg-teal-800 active:bg-teal-800',
                'text-sm font-semibold text-white',
                'transition-colors duration-150',
                'active:scale-[0.98]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                'w-full sm:w-auto',
              )}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  {t('invite_copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  {t('invite_copy_link')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex items-center justify-center h-10 px-4 rounded-md',
                'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
                'text-sm font-semibold text-gray-900 dark:text-white',
                'transition-colors duration-150',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                'w-full sm:w-auto',
              )}
            >
              {t('invite_done')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="invite-email"
              className="block text-xs font-semibold uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400"
            >
              {t('invite_email_label')}
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
              />
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                placeholder={t('invite_email_placeholder')}
                value={form.email}
                onBlur={() => setEmailTouched(true)}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
                aria-invalid={Boolean(emailLiveError)}
                aria-describedby={emailLiveError ? 'invite-email-error' : undefined}
                className={cn('pl-9 w-full', emailLiveError && 'border-red-400 dark:border-red-500/60')}
              />
            </div>
            {emailLiveError ? (
              <p
                id="invite-email-error"
                className="flex items-center gap-1 text-[11px] text-red-700 dark:text-red-400"
              >
                <AlertCircle className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
                {emailLiveError}
              </p>
            ) : null}
          </div>

          {/* Optional message / display name */}
          <div className="space-y-1.5">
            <label
              htmlFor="invite-name"
              className="block text-xs font-semibold uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400"
            >
              {t('invite_message_label')}
            </label>
            <textarea
              id="invite-name"
              rows={2}
              placeholder={t('invite_message_placeholder')}
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className={cn(
                'block w-full rounded-md px-3 py-2 resize-y',
                'border border-gray-200 dark:border-gray-800',
                'bg-white dark:bg-gray-900',
                'text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'transition-colors duration-150',
                'focus:outline-none focus:border-teal-700 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 dark:focus:ring-teal-400/20',
              )}
            />
          </div>

          {/* Role + preview */}
          <div className="space-y-1.5">
            <label
              htmlFor="invite-role"
              className="block text-xs font-semibold uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400"
            >
              {t('invite_role_label')}
            </label>
            <select
              id="invite-role"
              value={form.role}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  role: e.target.value as InviteRole,
                }))
              }
              className={cn(
                'h-10 w-full rounded-md px-3 cursor-pointer',
                'border border-gray-200 dark:border-gray-800',
                'bg-white dark:bg-gray-900',
                'text-sm text-gray-900 dark:text-white',
                'transition-colors duration-150',
                'focus:outline-none focus:border-teal-700 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 dark:focus:ring-teal-400/20',
              )}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`role_${role}`)}
                </option>
              ))}
            </select>

            {/* "What they can do" preview */}
            <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-3 py-2.5">
              <Shield
                className="h-4 w-4 mt-0.5 shrink-0 text-teal-700 dark:text-teal-400"
                strokeWidth={2.2}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleBadge role={form.role} label={t(`role_${form.role}`)} size="sm" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400">
                    {t('invite_role_capabilities_title')}
                  </span>
                </div>
                <p className="text-[11.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t(`role_${form.role}_desc`)}
                </p>
              </div>
            </div>
          </div>

          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-3 py-2"
            >
              <AlertCircle
                className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-700 dark:text-red-400"
                strokeWidth={2.4}
                aria-hidden="true"
              />
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                {submitError}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex items-center justify-center h-10 px-4 rounded-md',
                'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
                'text-sm font-semibold text-gray-900 dark:text-white',
                'transition-colors duration-150',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              )}
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'inline-flex items-center justify-center h-10 px-4 rounded-md',
                'bg-teal-700 hover:bg-teal-800 active:bg-teal-800',
                'text-sm font-semibold text-white',
                'transition-colors duration-150',
                'active:scale-[0.98]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {submitting ? t('invite_submitting') : t('invite_submit')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
