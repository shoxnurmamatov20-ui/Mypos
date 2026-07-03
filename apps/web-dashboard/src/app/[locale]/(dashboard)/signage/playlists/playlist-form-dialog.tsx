'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { useSignageStore } from '@/stores/signage';
import {
  Field,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  Toggle,
} from '../../settings/_components/settings-ui';

/** Create a new (empty) playlist — name + active. Slides are managed in the editor. */
export function PlaylistFormDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations('signage');
  const addPlaylist = useSignageStore((s) => s.addPlaylist);

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const headingId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addPlaylist({ name: trimmed, isActive });
    toast.success(t('playlists.created'));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={headingId} className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
          {t('playlists.add')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              autoFocus
              className={inputClass}
            />
          </Field>
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('active')}
            </span>
            <Toggle checked={isActive} onChange={setIsActive} ariaLabel={t('active')} />
          </div>
          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.06)] pt-4 dark:border-[rgba(255,255,255,0.05)]">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              {t('cancel')}
            </button>
            <button type="submit" disabled={name.trim().length === 0} className={primaryBtnClass}>
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
