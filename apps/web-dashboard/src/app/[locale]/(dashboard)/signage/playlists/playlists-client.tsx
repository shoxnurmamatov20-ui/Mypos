'use client';

import { ListMusic, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@mypos/ui';
import { type Playlist, playlistDuration, useSignageHydrated, useSignageStore } from '@/stores/signage';
import {
  Toggle,
  primaryBtnClass,
  secondaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
} from '../../settings/_components/settings-ui';
import { PlaylistEditorDialog } from './playlist-editor-dialog';
import { PlaylistFormDialog } from './playlist-form-dialog';

export function PlaylistsClient() {
  const hydrated = useSignageHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <PlaylistsInner />;
}

function fmtDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function PlaylistsInner() {
  const t = useTranslations('signage');
  const playlists = useSignageStore((s) => s.playlists);
  const updatePlaylist = useSignageStore((s) => s.updatePlaylist);
  const deletePlaylist = useSignageStore((s) => s.deletePlaylist);

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingPlaylist = playlists.find((p) => p.id === editingId) ?? null;

  function handleDelete(p: Playlist) {
    if (!confirm(t('confirm_delete'))) return;
    deletePlaylist(p.id);
    toast.success(t('playlists.deleted'));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          className={cn(primaryBtnClass, 'inline-flex items-center gap-1.5')}
          onClick={() => setCreating(true)}
        >
          <Plus className="h-4 w-4" /> {t('playlists.add')}
        </button>
      </div>

      {playlists.length === 0 ? (
        <SettingsCard>
          <p className="py-8 text-center text-sm text-[#62716d] dark:text-[#94a3b8]">{t('playlists.empty')}</p>
        </SettingsCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {playlists.map((p) => (
            <div
              key={p.id}
              className={cn(
                'flex flex-col gap-3 rounded-2xl border border-[rgba(22,34,31,0.09)] bg-white p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(18,34,31,0.07)] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]',
                !p.isActive && 'opacity-60',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#eef4f3] text-[#0f766e] dark:bg-[#1a2235] dark:text-teal-300">
                  <ListMusic className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#16221f] dark:text-white">{p.name}</p>
                  <p className="text-[12px] text-[#62716d] [font-feature-settings:'tnum'] dark:text-[#94a3b8]">
                    {p.slides.length} {t('playlists.slides_count')} · {fmtDuration(playlistDuration(p))}
                  </p>
                </div>
                <Toggle checked={p.isActive} onChange={(v) => updatePlaylist(p.id, { isActive: v })} ariaLabel={t('active')} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingId(p.id)} className={cn(secondaryBtnClass, 'flex-1 text-center text-xs')}>
                  {t('edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                  aria-label={t('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <PlaylistFormDialog onClose={() => setCreating(false)} />}
      {editingPlaylist && <PlaylistEditorDialog playlist={editingPlaylist} onClose={() => setEditingId(null)} />}
    </div>
  );
}
