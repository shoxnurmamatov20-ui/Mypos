'use client';

import { Loader2, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

/**
 * Confirms an impersonation handoff. The mutation runs on the parent — we
 * just collect a confirmation click here. On success the parent opens a
 * new tab with the token in the URL fragment.
 */
export function ImpersonateConfirmModal({ open, onClose, onConfirm, loading = false }: Props) {
  const t = useTranslations('tenant_detail');
  const tCommon = useTranslations('common');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('impersonate_confirm_title')}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
          <Shield
            className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            {t('impersonate_confirm_message')}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
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
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 text-sm font-bold text-white transition-colors w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Shield className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{t('impersonate_confirm_button')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
