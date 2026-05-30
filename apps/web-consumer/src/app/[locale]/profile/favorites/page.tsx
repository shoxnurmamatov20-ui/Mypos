'use client';

import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type FavoriteRestaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine?: string;
  rating?: number;
  cover_url?: string;
  added_at: string;
};

const STORAGE_KEY = 'mypos_consumer_favorites';

function loadFavorites(): FavoriteRestaurant[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoriteRestaurant[];
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteRestaurant[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const locale = useLocale();
  const [items, setItems] = useState<FavoriteRestaurant[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadFavorites());
    setMounted(true);
  }, []);

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveFavorites(next);
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
          <Heart className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-3 text-base font-bold text-neutral-900">{t('empty_title')}</h3>
          <p className="mt-1 text-sm text-neutral-600">{t('empty_hint')}</p>
          <Link
            href={`/${locale}/restaurants` as Route}
            className="mt-4 inline-flex items-center rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition active:scale-95"
          >
            {t('browse')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
            >
              <Link href={`/${locale}/restaurants/${r.slug}` as Route} className="flex gap-3 p-3">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" className="h-20 w-24 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-20 w-24 rounded-xl bg-neutral-100 shrink-0 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-neutral-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-900 truncate">{r.name}</p>
                  {r.cuisine && (
                    <p className="text-xs text-neutral-600 truncate mt-0.5">{r.cuisine}</p>
                  )}
                  {r.rating != null && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {r.rating.toFixed(1)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    remove(r.id);
                  }}
                  className="shrink-0 self-start rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition"
                  aria-label={t('remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
