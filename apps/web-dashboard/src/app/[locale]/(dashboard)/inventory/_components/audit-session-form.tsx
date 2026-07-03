'use client';

import { auditSessionsApi, type CreateAuditSessionInput } from '@mypos/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { DocDetailModal } from './doc-detail-modal';
import { inputClass, labelClass, primaryBtnClass, secondaryBtnClass } from './ui-helpers';
import { WarehouseSelect } from './warehouse-select';

type Props = {
  onClose: () => void;
  /** Called with the newly-created session id so the parent can open detail. */
  onCreated?: (id: string) => void;
};

export function AuditSessionForm({ onClose, onCreated }: Props) {
  const t = useTranslations('inventory');
  const qc = useQueryClient();

  const [warehouseId, setWarehouseId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: (input: CreateAuditSessionInput) => auditSessionsApi.create(apiClient, input),
    onSuccess: (res) => {
      toast.success(t('toast.created'));
      void qc.invalidateQueries({ queryKey: ['audit-sessions'] });
      const newId = res?.data?.id;
      onClose();
      if (newId && onCreated) onCreated(newId);
    },
    onError: () => toast.error(t('toast.save_failed')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error(t('form.warehouse_required'));
      return;
    }
    mutation.mutate({
      warehouse_id: warehouseId,
      notes: notes.trim() || null,
    });
  };

  return (
    <DocDetailModal
      title={t('actions.new_audit')}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className={secondaryBtnClass}
          >
            {t('actions.cancel')}
          </button>
          <button
            type="submit"
            form="audit-form"
            disabled={mutation.isPending}
            className={primaryBtnClass}
          >
            {mutation.isPending ? t('actions.saving') : t('actions.save')}
          </button>
        </>
      }
    >
      <form id="audit-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>{t('fields.warehouse')}</label>
          <WarehouseSelect value={warehouseId} onChange={setWarehouseId} />
        </div>
        <div>
          <label className={labelClass}>{t('fields.notes')}</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>
      </form>
    </DocDetailModal>
  );
}
