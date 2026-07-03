'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { type DeviceOrientation, type SignageDevice, useSignageStore } from '@/stores/signage';
import {
  Field,
  FieldGroup,
  inputClass,
  primaryBtnClass,
  SegmentedControl,
  type SegmentOption,
  secondaryBtnClass,
  Toggle,
} from '../../settings/_components/settings-ui';

interface Props {
  /** Existing device when editing; null when creating. */
  device: SignageDevice | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DeviceFormDialog({ device, onClose, onSaved }: Props) {
  const t = useTranslations('signage');
  const playlists = useSignageStore((s) => s.playlists);
  const addDevice = useSignageStore((s) => s.addDevice);
  const updateDevice = useSignageStore((s) => s.updateDevice);

  const isEdit = device !== null;

  const [name, setName] = useState(device?.name ?? '');
  const [location, setLocation] = useState(device?.location ?? '');
  const [orientation, setOrientation] = useState<DeviceOrientation>(
    device?.orientation ?? 'landscape',
  );
  const [playlistId, setPlaylistId] = useState(device?.playlistId ?? '');
  const [isOnline, setIsOnline] = useState<boolean>(device?.isOnline ?? false);
  const [note, setNote] = useState(device?.note ?? '');
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
    const payload = {
      name: trimmed,
      location: location.trim(),
      orientation,
      playlistId,
      isOnline,
      note: note.trim(),
    };
    if (isEdit && device) {
      updateDevice(device.id, payload);
      toast.success(t('devices.updated'));
    } else {
      addDevice(payload);
      toast.success(t('devices.created'));
    }
    onSaved();
  }

  const orientationOptions: readonly SegmentOption<DeviceOrientation>[] = [
    { value: 'landscape', label: t('devices.landscape') },
    { value: 'portrait', label: t('devices.portrait') },
  ];

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
          {isEdit ? t('devices.edit') : t('devices.add')}
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

          <Field label={t('location')}>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </Field>

          <FieldGroup label={t('devices.orientation')}>
            <SegmentedControl
              options={orientationOptions}
              value={orientation}
              onChange={setOrientation}
              ariaLabel={t('devices.orientation')}
            />
          </FieldGroup>

          <Field label={t('devices.playlist')}>
            <select
              className={inputClass}
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
            >
              <option value="">{t('devices.no_playlist')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('note')}>
            <textarea
              className={cn(inputClass, 'resize-none')}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </Field>

          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('status')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">
                {isOnline ? t('online') : t('offline')}
              </span>
              <Toggle checked={isOnline} onChange={setIsOnline} ariaLabel={t('status')} />
            </div>
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
