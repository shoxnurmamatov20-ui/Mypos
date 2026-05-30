'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';

type SuspendReason = 'non_payment' | 'abuse' | 'other';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: SuspendReason; notes?: string }) => void;
  loading?: boolean;
};

/**
 * Suspend-tenant modal — 3 radio reasons + optional notes textarea.
 * Submits to the parent which fires the suspend mutation.
 */
export function SuspendTenantModal({ open, onClose, onConfirm, loading = false }: Props) {
  const t = useTranslations('tenant_detail');
  const tCommon = useTranslations('common');
  const [reason, setReason] = useState<SuspendReason>('non_payment');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setReason('non_payment');
      setNotes('');
    }
  }, [open]);

  const reasonOptions: { value: SuspendReason; label: string }[] = [
    { value: 'non_payment', label: t('suspend_reason_non_payment') },
    { value: 'abuse', label: t('suspend_reason_abuse') },
    { value: 'other', label: t('suspend_reason_other') },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('suspend_modal_title')}
      description={t('suspend_modal_subtitle')}
      size="md"
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-2 block text-sm font-semibold text-[#16221f] dark:text-neutral-300">
            {t('suspend_reason_label')}
          </legend>
          <div className="space-y-2">
            {reasonOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center gap-3 cursor-pointer rounded-lg border px-3 py-2.5 transition-colors',
                  reason === opt.value
                    ? 'border-[#0f766e] dark:border-[#14b8a6] bg-[rgba(15,118,110,0.08)] dark:bg-[rgba(20,184,166,0.10)]'
                    : 'border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
                )}
              >
                <input
                  type="radio"
                  name="suspend-reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="h-4 w-4 cursor-pointer accent-[#0f766e] dark:accent-[#14b8a6]"
                />
                <span className="text-sm font-semibold text-[#16221f] dark:text-white">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="suspend-notes"
            className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-neutral-300"
          >
            {t('suspend_notes_label')}
          </label>
          <Textarea
            id="suspend-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('suspend_notes_placeholder')}
            rows={3}
          />
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
            onClick={() => onConfirm({ reason, notes: notes.trim() || undefined })}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-4 text-sm font-bold text-white transition-colors w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            <span>{t('suspend_confirm')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
