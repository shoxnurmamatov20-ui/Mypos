'use client';

import { cn } from '@mypos/ui';
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Plus,
  Trash2,
  Type as TypeIcon,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { type Playlist, type SlideKind, useSignageStore } from '@/stores/signage';
import {
  Field,
  inputClass,
  primaryBtnClass,
  SegmentedControl,
  type SegmentOption,
  Toggle,
} from '../../settings/_components/settings-ui';

/**
 * Edit an existing playlist: name + active + slide manager (add / reorder /
 * set duration / remove). All mutations write to the store live; "Save" just closes.
 */
export function PlaylistEditorDialog({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  const t = useTranslations('signage');
  const banners = useSignageStore((s) => s.banners);
  const updatePlaylist = useSignageStore((s) => s.updatePlaylist);
  const addSlide = useSignageStore((s) => s.addSlide);
  const updateSlide = useSignageStore((s) => s.updateSlide);
  const removeSlide = useSignageStore((s) => s.removeSlide);
  const moveSlide = useSignageStore((s) => s.moveSlide);
  const headingId = useId();

  const [newKind, setNewKind] = useState<SlideKind>('banner');
  const [newBannerId, setNewBannerId] = useState(banners[0]?.id ?? '');
  const [newText, setNewText] = useState('');
  const [newDuration, setNewDuration] = useState('8');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const bannerTitle = (id: string) =>
    banners.find((b) => b.id === id)?.title ?? t('playlists.deleted_banner');

  function handleAddSlide() {
    const parsed = Number.parseInt(newDuration, 10);
    const durationSec = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
    if (newKind === 'banner') {
      if (!newBannerId) return;
      addSlide(playlist.id, { kind: 'banner', bannerId: newBannerId, text: '', durationSec });
    } else {
      const txt = newText.trim();
      if (!txt) return;
      addSlide(playlist.id, { kind: 'text', bannerId: '', text: txt, durationSec });
      setNewText('');
    }
  }

  const kindOptions: readonly SegmentOption<SlideKind>[] = [
    { value: 'banner', label: t('playlists.slide_banner') },
    { value: 'text', label: t('playlists.slide_text') },
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:bg-[#111827] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-xl font-semibold text-[#16221f] dark:text-white">
            {t('playlists.edit')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#62716d] transition-colors hover:bg-[#eef4f3] dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
            aria-label={t('cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label={t('name')}>
            <input
              type="text"
              value={playlist.name}
              onChange={(e) => updatePlaylist(playlist.id, { name: e.target.value })}
              maxLength={80}
              className={inputClass}
            />
          </Field>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
              {t('active')}
            </span>
            <Toggle
              checked={playlist.isActive}
              onChange={(v) => updatePlaylist(playlist.id, { isActive: v })}
              ariaLabel={t('active')}
            />
          </div>

          {/* Slides */}
          <div>
            <p className="mb-2 text-sm font-semibold text-[#16221f] dark:text-white">
              {t('playlists.slides_count')}
            </p>
            {playlist.slides.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[rgba(22,34,31,0.12)] py-6 text-center text-[13px] text-[#62716d] dark:border-[rgba(255,255,255,0.1)] dark:text-[#94a3b8]">
                {t('playlists.no_slides')}
              </p>
            ) : (
              <ul className="space-y-2">
                {playlist.slides.map((sl, i) => (
                  <li
                    key={sl.id}
                    className="flex items-center gap-2 rounded-lg border border-[rgba(22,34,31,0.09)] bg-[#fafbfb] p-2 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#0e1626]"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[rgba(22,34,31,0.06)] text-[11px] font-semibold text-[#62716d] [font-feature-settings:'tnum'] dark:bg-white/10 dark:text-[#94a3b8]">
                      {i + 1}
                    </span>
                    <span className="flex-shrink-0 text-[#62716d] dark:text-[#94a3b8]">
                      {sl.kind === 'banner' ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <TypeIcon className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#16221f] dark:text-[#e2e8f0]">
                      {sl.kind === 'banner' ? bannerTitle(sl.bannerId) : sl.text}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={sl.durationSec}
                        onChange={(e) => {
                          const v = Number.parseInt(e.target.value, 10);
                          updateSlide(playlist.id, sl.id, {
                            durationSec: Number.isFinite(v) && v > 0 ? v : 1,
                          });
                        }}
                        className={cn(
                          inputClass,
                          'w-14 px-2 py-1 text-center',
                          "[font-feature-settings:'tnum']",
                        )}
                        aria-label={t('playlists.duration_sec')}
                      />
                      <span className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">s</span>
                      <button
                        type="button"
                        onClick={() => moveSlide(playlist.id, sl.id, 'up')}
                        disabled={i === 0}
                        className="rounded p-1 text-[#62716d] transition-colors hover:bg-[#eef4f3] disabled:opacity-30 dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
                        aria-label={t('playlists.move_up')}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(playlist.id, sl.id, 'down')}
                        disabled={i === playlist.slides.length - 1}
                        className="rounded p-1 text-[#62716d] transition-colors hover:bg-[#eef4f3] disabled:opacity-30 dark:text-[#94a3b8] dark:hover:bg-[#1a2235]"
                        aria-label={t('playlists.move_down')}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlide(playlist.id, sl.id)}
                        className="rounded p-1 text-[#62716d] transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-[#94a3b8] dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                        aria-label={t('playlists.remove_slide')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add slide */}
          <div className="rounded-xl border border-[rgba(22,34,31,0.09)] p-3 dark:border-[rgba(255,255,255,0.07)]">
            <p className="mb-2 text-[13px] font-semibold text-[#16221f] dark:text-white">
              {t('playlists.add_slide')}
            </p>
            <div className="space-y-2">
              <SegmentedControl
                options={kindOptions}
                value={newKind}
                onChange={setNewKind}
                ariaLabel={t('type')}
              />
              {newKind === 'banner' ? (
                <select
                  className={inputClass}
                  value={newBannerId}
                  onChange={(e) => setNewBannerId(e.target.value)}
                  aria-label={t('playlists.select_banner')}
                >
                  <option value="" disabled>
                    {t('playlists.select_banner')}
                  </option>
                  {banners.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder={t('playlists.text_placeholder')}
                  maxLength={120}
                  className={inputClass}
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className={cn(inputClass, 'w-24', "[font-feature-settings:'tnum']")}
                  aria-label={t('playlists.duration_sec')}
                />
                <span className="text-[12px] text-[#62716d] dark:text-[#94a3b8]">
                  {t('playlists.duration_sec')}
                </span>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className={cn(primaryBtnClass, 'ml-auto inline-flex items-center gap-1.5')}
                >
                  <Plus className="h-4 w-4" /> {t('add')}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-[rgba(22,34,31,0.06)] pt-4 dark:border-[rgba(255,255,255,0.05)]">
            <button type="button" onClick={onClose} className={primaryBtnClass}>
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
