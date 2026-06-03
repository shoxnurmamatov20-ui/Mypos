'use client';

/**
 * Local (per-browser) digital-signage store for the manager panel
 * (📺 Menyu-translyatsiya / menu broadcast).
 *
 * Backend has no signage endpoints yet — devices, playlists and banners are
 * persisted to localStorage. When backend endpoints land, swap the persist
 * layer. Devices + Playlists are role-restricted (see canManageSignage).
 */

import type { AuthUser } from '@mypos/api-client';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DeviceOrientation = 'landscape' | 'portrait';

export interface SignageDevice {
  id: string;
  name: string;
  location: string;
  orientation: DeviceOrientation;
  isOnline: boolean;
  /** Assigned playlist id; '' = unassigned. */
  playlistId: string;
  note: string;
}

export type BannerType = 'promo' | 'discount' | 'new';

export interface Banner {
  id: string;
  title: string;
  description: string;
  type: BannerType;
  /** Optional image URL (no upload backend yet). */
  imageUrl: string;
  /** Fallback background colour for the preview tile. */
  color: string;
  /** ISO yyyy-mm-dd; '' = open-ended. */
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type SlideKind = 'banner' | 'text';

export interface Slide {
  id: string;
  kind: SlideKind;
  /** References a Banner when kind === 'banner'. */
  bannerId: string;
  /** Free text when kind === 'text'. */
  text: string;
  durationSec: number;
}

export interface Playlist {
  id: string;
  name: string;
  isActive: boolean;
  slides: Slide[];
}

// ─── Seeded demo data ─────────────────────────────────────────────────────────

const DEFAULT_BANNERS: readonly Banner[] = [
  {
    id: 'bn-lunch',
    title: 'Tushlik aksiyasi',
    description: '12:00–15:00 — barcha lavashlarga 20% chegirma',
    type: 'discount',
    imageUrl: '',
    color: '#ea7c69',
    startDate: '',
    endDate: '',
    isActive: true,
  },
  {
    id: 'bn-new',
    title: 'Yangi: Lavash XXL',
    description: "Ikki barobar go'sht, yangi ta'm",
    type: 'new',
    imageUrl: '',
    color: '#0f766e',
    startDate: '',
    endDate: '',
    isActive: true,
  },
];

const DEFAULT_PLAYLISTS: readonly Playlist[] = [
  {
    id: 'pl-main',
    name: 'Asosiy menyu',
    isActive: true,
    slides: [
      { id: 'sl-1', kind: 'banner', bannerId: 'bn-lunch', text: '', durationSec: 10 },
      { id: 'sl-2', kind: 'banner', bannerId: 'bn-new', text: '', durationSec: 8 },
      { id: 'sl-3', kind: 'text', bannerId: '', text: 'Xush kelibsiz!', durationSec: 5 },
    ],
  },
];

const DEFAULT_DEVICES: readonly SignageDevice[] = [
  {
    id: 'dv-hall',
    name: 'Zal ekrani',
    location: 'Asosiy zal',
    orientation: 'landscape',
    isOnline: true,
    playlistId: 'pl-main',
    note: '',
  },
  {
    id: 'dv-entry',
    name: 'Kirish displeyi',
    location: 'Kirish',
    orientation: 'portrait',
    isOnline: false,
    playlistId: '',
    note: '',
  },
];

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface SignageState {
  devices: SignageDevice[];
  playlists: Playlist[];
  banners: Banner[];
  // devices
  addDevice: (input: Omit<SignageDevice, 'id'>) => void;
  updateDevice: (id: string, patch: Partial<Omit<SignageDevice, 'id'>>) => void;
  deleteDevice: (id: string) => void;
  // banners
  addBanner: (input: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, patch: Partial<Omit<Banner, 'id'>>) => void;
  deleteBanner: (id: string) => void;
  // playlists
  addPlaylist: (input: Omit<Playlist, 'id' | 'slides'>) => void;
  updatePlaylist: (id: string, patch: Partial<Pick<Playlist, 'name' | 'isActive'>>) => void;
  deletePlaylist: (id: string) => void;
  // slides (within a playlist)
  addSlide: (playlistId: string, slide: Omit<Slide, 'id'>) => void;
  updateSlide: (playlistId: string, slideId: string, patch: Partial<Omit<Slide, 'id'>>) => void;
  removeSlide: (playlistId: string, slideId: string) => void;
  moveSlide: (playlistId: string, slideId: string, dir: 'up' | 'down') => void;
}

export const useSignageStore = create<SignageState>()(
  persist(
    (set) => ({
      devices: [...DEFAULT_DEVICES],
      playlists: DEFAULT_PLAYLISTS.map((p) => ({ ...p, slides: [...p.slides] })),
      banners: [...DEFAULT_BANNERS],

      addDevice: (input) => set((s) => ({ devices: [...s.devices, { ...input, id: uid() }] })),
      updateDevice: (id, patch) =>
        set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDevice: (id) => set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

      addBanner: (input) => set((s) => ({ banners: [{ ...input, id: uid() }, ...s.banners] })),
      updateBanner: (id, patch) =>
        set((s) => ({ banners: s.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      deleteBanner: (id) =>
        set((s) => ({
          banners: s.banners.filter((b) => b.id !== id),
          // drop slides that referenced the deleted banner
          playlists: s.playlists.map((pl) => ({
            ...pl,
            slides: pl.slides.filter((sl) => !(sl.kind === 'banner' && sl.bannerId === id)),
          })),
        })),

      addPlaylist: (input) =>
        set((s) => ({ playlists: [...s.playlists, { ...input, id: uid(), slides: [] }] })),
      updatePlaylist: (id, patch) =>
        set((s) => ({ playlists: s.playlists.map((pl) => (pl.id === id ? { ...pl, ...patch } : pl)) })),
      deletePlaylist: (id) =>
        set((s) => ({
          playlists: s.playlists.filter((pl) => pl.id !== id),
          // unassign the playlist from any device that used it
          devices: s.devices.map((d) => (d.playlistId === id ? { ...d, playlistId: '' } : d)),
        })),

      addSlide: (playlistId, slide) =>
        set((s) => ({
          playlists: s.playlists.map((pl) =>
            pl.id === playlistId ? { ...pl, slides: [...pl.slides, { ...slide, id: uid() }] } : pl,
          ),
        })),
      updateSlide: (playlistId, slideId, patch) =>
        set((s) => ({
          playlists: s.playlists.map((pl) =>
            pl.id === playlistId
              ? { ...pl, slides: pl.slides.map((sl) => (sl.id === slideId ? { ...sl, ...patch } : sl)) }
              : pl,
          ),
        })),
      removeSlide: (playlistId, slideId) =>
        set((s) => ({
          playlists: s.playlists.map((pl) =>
            pl.id === playlistId ? { ...pl, slides: pl.slides.filter((sl) => sl.id !== slideId) } : pl,
          ),
        })),
      moveSlide: (playlistId, slideId, dir) =>
        set((s) => ({
          playlists: s.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            const idx = pl.slides.findIndex((sl) => sl.id === slideId);
            if (idx < 0) return pl;
            const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= pl.slides.length) return pl;
            const slides = [...pl.slides];
            const current = slides[idx];
            const target = slides[swapIdx];
            if (!current || !target) return pl;
            slides[idx] = target;
            slides[swapIdx] = current;
            return { ...pl, slides };
          }),
        })),
    }),
    { name: 'mypos_dashboard_signage' },
  ),
);

// ─── Role gate (🔒 Devices + Playlists are restricted) ───────────────────────

export const SIGNAGE_MANAGE_ROLES = ['super_admin', 'owner', 'admin', 'manager', 'director'];

/** Whether the user may manage restricted signage surfaces (devices/playlists). */
export function canManageSignage(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.is_super_admin) return true;
  const roles = user.roles ?? [];
  if (roles.length === 0) return true; // manager-panel fallback (panel already gated at login)
  return roles.some((r) => SIGNAGE_MANAGE_ROLES.includes(String(r).toLowerCase()));
}

/** Total playlist duration in seconds. */
export function playlistDuration(playlist: Playlist): number {
  return playlist.slides.reduce((sum, sl) => sum + (Number.isFinite(sl.durationSec) ? sl.durationSec : 0), 0);
}

/** SSR/CSR hydration guard (localStorage is client-only). */
export function useSignageHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
