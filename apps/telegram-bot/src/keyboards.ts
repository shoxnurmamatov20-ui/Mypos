import { Markup } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/types';
import type { PublicMenuCategory, PublicMenuItem } from '@mypos/api-client';
import { t } from './i18n.js';
import type { Lang, UserSession } from './types.js';
import { cartCount } from './services/user-session.js';

/**
 * Reusable keyboards. Callback-data follows the pattern:
 *   <namespace>:<action>[:<id>]
 * which is parsed by the action handlers in `bot.ts`.
 */

export function mainMenuKeyboard(session: UserSession) {
  const lang: Lang = session.lang;
  const count = cartCount(session);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('main_menu.menu', lang), 'menu:open'),
      Markup.button.callback(
        t('main_menu.cart', lang, { count }),
        'cart:open',
      ),
    ],
    [
      Markup.button.callback(t('main_menu.orders', lang), 'orders:list'),
      Markup.button.callback(
        t('main_menu.language', lang, { lang: lang.toUpperCase() }),
        'lang:open',
      ),
    ],
    [Markup.button.callback(t('main_menu.help', lang), 'help:show')],
  ]);
}

export function categoriesKeyboard(
  categories: PublicMenuCategory[],
  lang: Lang,
) {
  const rows: InlineKeyboardButton.CallbackButton[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    const a = categories[i];
    const b = categories[i + 1];
    const row: InlineKeyboardButton.CallbackButton[] = [];
    if (a !== undefined) {
      row.push(
        Markup.button.callback(
          categoryLabel(a, lang),
          `menu:cat:${a.id}`,
        ),
      );
    }
    if (b !== undefined) {
      row.push(
        Markup.button.callback(
          categoryLabel(b, lang),
          `menu:cat:${b.id}`,
        ),
      );
    }
    if (row.length > 0) rows.push(row);
  }
  rows.push([Markup.button.callback(t('menu.back', lang), 'home')]);
  return Markup.inlineKeyboard(rows);
}

export function itemsKeyboard(items: PublicMenuItem[], lang: Lang) {
  const rows: InlineKeyboardButton.CallbackButton[][] = items.map((item) => [
    Markup.button.callback(itemLabel(item, lang), `menu:item:${item.id}`),
  ]);
  rows.push([Markup.button.callback(t('menu.back', lang), 'menu:open')]);
  return Markup.inlineKeyboard(rows);
}

export function itemDetailKeyboard(itemId: string, lang: Lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t('menu.add_to_cart', lang), `cart:add:${itemId}`)],
    [Markup.button.callback(t('menu.back', lang), 'menu:open')],
  ]);
}

export function cartKeyboard(session: UserSession) {
  const lang = session.lang;
  const removeButtons: InlineKeyboardButton.CallbackButton[][] =
    session.cart.map((line) => [
      Markup.button.callback(
        `- ${line.display_name}`,
        `cart:rm:${line.menu_item_id}`,
      ),
    ]);
  const bottom: InlineKeyboardButton.CallbackButton[][] = [];
  if (session.cart.length > 0) {
    bottom.push([
      Markup.button.callback(t('cart.checkout', lang), 'cart:checkout'),
    ]);
    bottom.push([
      Markup.button.callback(t('cart.clear', lang), 'cart:clear'),
    ]);
  }
  bottom.push([Markup.button.callback(t('menu.back', lang), 'home')]);
  return Markup.inlineKeyboard([...removeButtons, ...bottom]);
}

export function languageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Ozbekcha', 'lang:set:uz'),
      Markup.button.callback('Русский', 'lang:set:ru'),
      Markup.button.callback('English', 'lang:set:en'),
    ],
    [Markup.button.callback('<-', 'home')],
  ]);
}

export function modeKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        t('checkout.mode_dine_in', lang),
        'checkout:mode:dine_in',
      ),
      Markup.button.callback(
        t('checkout.mode_delivery', lang),
        'checkout:mode:delivery',
      ),
    ],
    [Markup.button.callback(t('checkout.cancel', lang), 'checkout:cancel')],
  ]);
}

export function confirmKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('checkout.confirm', lang), 'checkout:confirm'),
      Markup.button.callback(t('checkout.cancel', lang), 'checkout:cancel'),
    ],
  ]);
}

function categoryLabel(cat: PublicMenuCategory, lang: Lang): string {
  return cat.name[lang] || cat.name.uz;
}

function itemLabel(item: PublicMenuItem, lang: Lang): string {
  const name = item.name[lang] || item.name.uz;
  const price = formatPrice(item.price.effective_amount, item.price.currency);
  return `${name} — ${price}`;
}

export function formatPrice(amount: number, currency: string): string {
  const whole = Math.round(amount).toString().replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );
  return `${whole} ${currency}`;
}
