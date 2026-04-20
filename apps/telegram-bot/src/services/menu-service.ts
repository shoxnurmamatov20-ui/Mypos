import {
  publicApi,
  type PublicMenuCategory,
  type PublicMenuItem,
  type PublicMenuResponse,
} from '@mypos/api-client';
import { apiClient, tenantSlug } from '../api.js';

/**
 * Fetches the public menu for the configured tenant and caches it in memory
 * for a short TTL. The public endpoint returns tenant + categories + items
 * in one shot, which is ideal for a chat-bot flow.
 */
type CachedMenu = {
  fetchedAt: number;
  data: PublicMenuResponse['data'];
};

const TTL_MS = 60_000;
let cache: CachedMenu | null = null;

async function loadMenu(): Promise<PublicMenuResponse['data']> {
  const fresh = cache !== null && Date.now() - cache.fetchedAt < TTL_MS;
  if (fresh && cache !== null) return cache.data;
  const res = await publicApi.menu.get(apiClient(), tenantSlug());
  cache = { fetchedAt: Date.now(), data: res.data };
  return res.data;
}

export async function listCategories(): Promise<PublicMenuCategory[]> {
  const menu = await loadMenu();
  return menu.categories.filter((c) => c.is_active);
}

export async function listItemsByCategory(
  categoryId: string,
): Promise<PublicMenuItem[]> {
  const menu = await loadMenu();
  return menu.items.filter(
    (i) => i.category_id === categoryId && i.is_active,
  );
}

export async function findItem(
  itemId: string,
): Promise<PublicMenuItem | null> {
  const menu = await loadMenu();
  return menu.items.find((i) => i.id === itemId) ?? null;
}

export function invalidateMenuCache(): void {
  cache = null;
}
