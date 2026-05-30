'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select, type SelectOption } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TenantPlan, TenantStatus } from '@/types/super-admin';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    plan: TenantPlan;
    status: TenantStatus;
    trialEndsAt: string;
    notes: string;
  }) => void;
  initialPlan: TenantPlan;
  initialStatus: TenantStatus;
  initialTrialEndsAt: string;
  initialNotes: string;
  loading?: boolean;
  /** Backend 422 field-level errors keyed by snake_case path. */
  fieldErrors?: Record<string, string>;
};

export function EditSubscriptionModal({
  open,
  onClose,
  onSave,
  initialPlan,
  initialStatus,
  initialTrialEndsAt,
  initialNotes,
  loading = false,
  fieldErrors = {},
}: Props) {
  const t = useTranslations('tenant_detail');
  const tPlans = useTranslations('plans');
  const tStatuses = useTranslations('statuses');
  const tCommon = useTranslations('common');

  const [plan, setPlan] = useState<TenantPlan>(initialPlan);
  const [status, setStatus] = useState<TenantStatus>(initialStatus);
  const [trialEndsAt, setTrialEndsAt] = useState<string>(initialTrialEndsAt);
  const [notes, setNotes] = useState<string>(initialNotes);

  useEffect(() => {
    if (open) {
      setPlan(initialPlan);
      setStatus(initialStatus);
      setTrialEndsAt(initialTrialEndsAt);
      setNotes(initialNotes);
    }
  }, [open, initialPlan, initialStatus, initialTrialEndsAt, initialNotes]);

  const planOptions: SelectOption<TenantPlan>[] = [
    { value: 'free', label: tPlans('free') },
    { value: 'starter', label: tPlans('starter') },
    { value: 'pro', label: tPlans('pro') },
    { value: 'business', label: tPlans('business') },
    { value: 'enterprise', label: tPlans('enterprise') },
  ];

  const statusOptions: SelectOption<TenantStatus>[] = [
    { value: 'active', label: tStatuses('active') },
    { value: 'trialing', label: tStatuses('trialing') },
    { value: 'past_due', label: tStatuses('past_due') },
    { value: 'suspended', label: tStatuses('suspended') },
    { value: 'cancelled', label: tStatuses('cancelled') },
  ];

  const planError = fieldErrors.subscription_plan ?? fieldErrors.plan;
  const statusError = fieldErrors.subscription_status ?? fieldErrors.status;
  const trialError = fieldErrors.trial_ends_at;
  const notesError = fieldErrors.notes;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('edit_subscription_modal_title')}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Select<TenantPlan>
            value={plan}
            onChange={setPlan}
            options={planOptions}
            label={t('subscription_plan')}
          />
          {planError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{planError}</p>
          ) : null}
        </div>

        <div>
          <Select<TenantStatus>
            value={status}
            onChange={setStatus}
            options={statusOptions}
            label={t('subscription_status')}
          />
          {statusError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{statusError}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="trial-ends"
            className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-neutral-300"
          >
            {t('edit_subscription_trial_ends_label')}
          </label>
          <Input
            id="trial-ends"
            type="date"
            value={trialEndsAt}
            onChange={(event) => setTrialEndsAt(event.target.value)}
            disabled={loading}
          />
          {trialError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{trialError}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="sub-notes"
            className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-neutral-300"
          >
            {t('subscription_notes')}
          </label>
          <Textarea
            id="sub-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            disabled={loading}
          />
          {notesError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{notesError}</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-4 text-sm font-semibold text-[#16221f] dark:text-gray-200 transition-colors hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave({ plan, status, trialEndsAt, notes })}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0f766e] hover:bg-[#0b5e57] px-4 text-sm font-bold text-white transition-colors w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            <span>{t('edit_subscription_save')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
