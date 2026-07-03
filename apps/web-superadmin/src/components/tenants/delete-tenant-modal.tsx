'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tenantName: string;
  /**
   * Preferred confirmation token — when provided we match against the slug
   * (URL-safe, unique, hard to type by accident). Falls back to name.
   */
  tenantSlug?: string;
  loading?: boolean;
};

/**
 * Hard delete modal — requires the user to type the tenant slug (or name)
 * verbatim before the confirm button enables. Loading state disables both
 * the field and the confirm.
 */
export function DeleteTenantModal({
  open,
  onClose,
  onConfirm,
  tenantName,
  tenantSlug,
  loading = false,
}: Props) {
  const t = useTranslations('tenant_detail');
  const tCommon = useTranslations('common');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (open) setConfirm('');
  }, [open]);

  const expected = tenantSlug || tenantName;
  const matches = confirm.trim() === expected.trim();

  return (
    <Modal open={open} onClose={onClose} title={t('delete_modal_title')} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-[#b42318] dark:text-red-400"
            aria-hidden="true"
          />
          <p className="text-sm text-red-900 dark:text-red-200 leading-relaxed">
            {t('delete_modal_message')}
          </p>
        </div>

        <div>
          <label
            htmlFor="delete-confirm"
            className="mb-1.5 block text-sm font-semibold text-[#16221f] dark:text-gray-200"
          >
            {t('delete_confirm_label', { name: expected })}
          </label>
          <Input
            id="delete-confirm"
            type="text"
            autoComplete="off"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder={expected}
            disabled={loading}
            aria-required="true"
            aria-invalid={confirm.length > 0 && !matches}
          />
          {confirm.length > 0 && !matches ? (
            <p className="mt-1 text-xs text-[#b42318] dark:text-red-400">
              Tenant slug bilan mos kelmaydi
            </p>
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
            disabled={!matches || loading}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-4 text-sm font-bold text-white transition-colors w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            <span>{t('delete_confirm_button')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
