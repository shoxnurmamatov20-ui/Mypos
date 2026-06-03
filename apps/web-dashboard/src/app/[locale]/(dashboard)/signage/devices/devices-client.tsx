'use client';

import { Monitor, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@mypos/ui';
import { type SignageDevice, useSignageHydrated, useSignageStore } from '@/stores/signage';
import {
  Toggle,
  inputClass,
  primaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
} from '../../settings/_components/settings-ui';
import { DeviceFormDialog } from './device-form-dialog';

export function DevicesClient() {
  const hydrated = useSignageHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <DevicesInner />;
}

type DialogState = SignageDevice | 'new' | null;

function DevicesInner() {
  const t = useTranslations('signage');
  const devices = useSignageStore((s) => s.devices);
  const playlists = useSignageStore((s) => s.playlists);
  const updateDevice = useSignageStore((s) => s.updateDevice);
  const deleteDevice = useSignageStore((s) => s.deleteDevice);

  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);

  const playlistName = (id: string) => playlists.find((p) => p.id === id)?.name ?? '';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q));
  }, [devices, search]);

  const editing: SignageDevice | null = dialog !== null && dialog !== 'new' ? dialog : null;

  function handleDelete(d: SignageDevice) {
    if (!confirm(t('confirm_delete'))) return;
    deleteDevice(d.id);
    toast.success(t('devices.deleted'));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          className={cn(inputClass, 'w-auto min-w-[200px] flex-1')}
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search_placeholder')}
        />
        <button
          type="button"
          className={cn(primaryBtnClass, 'inline-flex items-center gap-1.5')}
          onClick={() => setDialog('new')}
        >
          <Plus className="h-4 w-4" /> {t('devices.add')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <SettingsCard>
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">{t('devices.empty')}</p>
        </SettingsCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const assigned = playlistName(d.playlistId);
            return (
              <div
                key={d.id}
                className="flex flex-col gap-3 rounded-2xl border border-[rgba(22,34,31,0.09)] bg-white p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(18,34,31,0.07)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#eef4f3] text-[#0f766e] dark:bg-[#1a2235] dark:text-teal-300">
                    <Monitor className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#16221f] dark:text-white">{d.name}</p>
                    <p className="truncate text-[12px] text-[#62716d] dark:text-[#94a3b8]">{d.location || '—'}</p>
                  </div>
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      d.isOnline
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-[rgba(22,34,31,0.07)] text-[#62716d] dark:bg-white/10 dark:text-[#94a3b8]',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', d.isOnline ? 'bg-emerald-500' : 'bg-[#94a3b8]')} aria-hidden />
                    {d.isOnline ? t('online') : t('offline')}
                  </span>
                </div>

                <dl className="space-y-1 text-[12px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('devices.orientation')}</dt>
                    <dd className="font-medium text-[#16221f] dark:text-[#e2e8f0]">
                      {d.orientation === 'landscape' ? t('devices.landscape') : t('devices.portrait')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#62716d] dark:text-[#94a3b8]">{t('devices.playlist')}</dt>
                    <dd className={cn('truncate font-medium', assigned ? 'text-[#16221f] dark:text-[#e2e8f0]' : 'text-[#62716d] dark:text-[#94a3b8]')}>
                      {assigned || t('devices.no_playlist')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgba(22,34,31,0.06)] pt-2 dark:border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                    <Toggle checked={d.isOnline} onChange={(v) => updateDevice(d.id, { isOnline: v })} ariaLabel={t('status')} />
                    {t('status')}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDialog(d)}
                      className="rounded-lg p-2 text-[#62716d] transition-colors hover:bg-[#eef4f3] hover:text-[#0f766e] active:scale-95 dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
                      aria-label={t('edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      className="rounded-lg p-2 text-[#62716d] transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:text-[#94a3b8] dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialog !== null && <DeviceFormDialog device={editing} onClose={() => setDialog(null)} onSaved={() => setDialog(null)} />}
    </div>
  );
}
