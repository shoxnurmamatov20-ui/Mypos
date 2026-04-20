import type { CartItem, Lang, UserSession } from '../types.js';

/**
 * In-memory user session store.
 *
 * NOTE: This is MVP only. For production use Redis (same API, different impl)
 * so sessions survive restarts and work across multiple bot workers.
 */
const store = new Map<number, UserSession>();

export function getSession(telegramUserId: number, chatId: number): UserSession {
  const existing = store.get(telegramUserId);
  if (existing !== undefined) {
    // Keep chat_id fresh in case the user reopened the chat elsewhere.
    if (existing.chat_id !== chatId) existing.chat_id = chatId;
    return existing;
  }
  const fresh: UserSession = {
    lang: 'uz',
    cart: [],
    chat_id: chatId,
  };
  store.set(telegramUserId, fresh);
  return fresh;
}

export function setLang(telegramUserId: number, lang: Lang): void {
  const s = store.get(telegramUserId);
  if (s !== undefined) s.lang = lang;
}

export function addToCart(telegramUserId: number, item: CartItem): void {
  const s = store.get(telegramUserId);
  if (s === undefined) return;
  const existing = s.cart.find((c) => c.menu_item_id === item.menu_item_id);
  if (existing !== undefined) {
    existing.quantity += item.quantity;
  } else {
    s.cart.push({ ...item });
  }
}

export function removeFromCart(telegramUserId: number, menuItemId: string): void {
  const s = store.get(telegramUserId);
  if (s === undefined) return;
  s.cart = s.cart.filter((c) => c.menu_item_id !== menuItemId);
}

export function clearCart(telegramUserId: number): void {
  const s = store.get(telegramUserId);
  if (s === undefined) return;
  s.cart = [];
}

export function cartCount(session: UserSession): number {
  return session.cart.reduce((sum, c) => sum + c.quantity, 0);
}

export function cartTotal(session: UserSession): number {
  return session.cart.reduce((sum, c) => sum + c.price_amount * c.quantity, 0);
}

/** Used by the order-status webhook handler to find the right chat to push to. */
export function findByChatId(chatId: number): UserSession | null {
  for (const s of store.values()) {
    if (s.chat_id === chatId) return s;
  }
  return null;
}

/** Visible for testing / admin debug only. */
export function _debug_all(): ReadonlyMap<number, UserSession> {
  return store;
}
