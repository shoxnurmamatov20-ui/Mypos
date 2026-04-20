import type { Context, Scenes } from 'telegraf';
import type { InlineKeyboardMarkup, Update } from 'telegraf/types';

/** Convenient alias for `Markup.inlineKeyboard(...)` return type.
 *  Structural shape of `{ reply_markup }` matches the Markup class instance. */
export type InlineKb = { reply_markup: InlineKeyboardMarkup };

export type Lang = 'uz' | 'ru' | 'en';

/** A single cart line kept in session. */
export type CartItem = {
  menu_item_id: string;
  name: string;
  price_amount: number;
  currency: string;
  quantity: number;
  /** Localized name snapshot at the time of adding, used for cart display. */
  display_name: string;
};

export type OrderMode = 'dine_in' | 'delivery';

/** Data collected during the checkout scene. */
export type CheckoutDraft = {
  mode: OrderMode | null;
  table_number: string | null;
  phone: string | null;
  address: string | null;
};

/** Persistent per-user state kept by `services/user-session.ts`. */
export type UserSession = {
  lang: Lang;
  cart: CartItem[];
  /** Telegram chat_id for pushing order-status updates. */
  chat_id: number;
};

/** Scene-local state (cleared when scene exits). */
export type BotSceneSession = Scenes.SceneSessionData & {
  checkout?: CheckoutDraft;
  browse?: {
    category_id?: string;
  };
};

/** Root Telegraf session attached to every update. */
export type BotSession = Scenes.SceneSession<BotSceneSession> & {
  lang?: Lang;
};

/** Custom Telegraf context used everywhere in this bot. */
export interface BotContext extends Context<Update> {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, BotSceneSession>;
  /** The resolved user-session record for the current user. */
  userSession: UserSession;
  /** Current language of the user, convenience shortcut. */
  lang: Lang;
}
