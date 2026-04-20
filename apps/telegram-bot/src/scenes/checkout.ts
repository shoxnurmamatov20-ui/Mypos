import { Scenes } from 'telegraf';
import { isValidUZPhone, normalizeUZPhone } from '@mypos/utils';
import { t } from '../i18n.js';
import { confirmKeyboard, formatPrice, modeKeyboard } from '../keyboards.js';
import { placeOrder } from '../services/order-service.js';
import { cartTotal, clearCart } from '../services/user-session.js';
import type { BotContext, CheckoutDraft, OrderMode } from '../types.js';

export const CHECKOUT_SCENE_ID = 'checkout';

/**
 * Checkout scene. Flow:
 *   1. enter → ask mode (dine-in / delivery)
 *   2a. dine-in → ask table number → summary
 *   2b. delivery → ask phone → ask address → summary
 *   3. on confirm → POST order → reply order_no → leave
 */
export function buildCheckoutScene(): Scenes.BaseScene<BotContext> {
  const scene = new Scenes.BaseScene<BotContext>(CHECKOUT_SCENE_ID);

  scene.enter(async (ctx) => {
    ctx.scene.session.checkout = {
      mode: null,
      table_number: null,
      phone: null,
      address: null,
    };
    await ctx.reply(t('checkout.ask_mode', ctx.lang), modeKeyboard(ctx.lang));
  });

  scene.action(/^checkout:mode:(dine_in|delivery)$/, async (ctx) => {
    const match = ctx.match[1];
    if (match !== 'dine_in' && match !== 'delivery') return;
    const draft = ensureDraft(ctx);
    const mode: OrderMode = match;
    draft.mode = mode;
    await ctx.answerCbQuery().catch(() => undefined);
    if (mode === 'dine_in') {
      await ctx.reply(t('checkout.ask_table', ctx.lang));
    } else {
      await ctx.reply(t('checkout.ask_phone', ctx.lang));
    }
  });

  scene.action('checkout:cancel', async (ctx) => {
    await ctx.answerCbQuery().catch(() => undefined);
    await ctx.reply(t('checkout.cancel', ctx.lang));
    await ctx.scene.leave();
  });

  scene.on('text', async (ctx) => {
    const draft = ensureDraft(ctx);
    const text = ctx.message.text.trim();
    if (draft.mode === null) {
      await ctx.reply(t('checkout.ask_mode', ctx.lang), modeKeyboard(ctx.lang));
      return;
    }
    if (draft.mode === 'dine_in') {
      await handleDineInText(ctx, draft, text);
      return;
    }
    await handleDeliveryText(ctx, draft, text);
  });

  scene.action('checkout:confirm', async (ctx) => {
    await ctx.answerCbQuery().catch(() => undefined);
    const draft = ensureDraft(ctx);
    const session = ctx.userSession;
    if (session.cart.length === 0) {
      await ctx.reply(t('cart.empty', ctx.lang));
      await ctx.scene.leave();
      return;
    }
    try {
      const order = await placeOrder({
        mode: draft.mode ?? 'dine_in',
        cart: session.cart,
        tableId: null,
        phone: draft.phone,
        address: draft.address,
        notes: draft.table_number
          ? `Table: ${draft.table_number}`
          : null,
      });
      if (ctx.from?.id !== undefined) clearCart(ctx.from.id);
      await ctx.reply(
        t('checkout.placed', ctx.lang, { order_no: order.order_no }),
      );
    } catch (error) {
      console.error('X place order failed:', error);
      await ctx.reply(t('errors.generic', ctx.lang));
    }
    await ctx.scene.leave();
  });

  return scene;
}

function ensureDraft(ctx: BotContext): CheckoutDraft {
  let draft = ctx.scene.session.checkout;
  if (!draft) {
    draft = { mode: null, table_number: null, phone: null, address: null };
    ctx.scene.session.checkout = draft;
  }
  return draft;
}

async function handleDineInText(
  ctx: BotContext,
  draft: CheckoutDraft,
  text: string,
): Promise<void> {
  if (draft.table_number === null) {
    if (!/^\d{1,4}$/.test(text)) {
      await ctx.reply(t('errors.invalid_table', ctx.lang));
      return;
    }
    draft.table_number = text;
    await showSummary(ctx, draft);
  }
}

async function handleDeliveryText(
  ctx: BotContext,
  draft: CheckoutDraft,
  text: string,
): Promise<void> {
  if (draft.phone === null) {
    if (!isValidUZPhone(text)) {
      await ctx.reply(t('errors.invalid_phone', ctx.lang));
      return;
    }
    draft.phone = normalizeUZPhone(text);
    await ctx.reply(t('checkout.ask_address', ctx.lang));
    return;
  }
  if (draft.address === null) {
    draft.address = text;
    await showSummary(ctx, draft);
  }
}

async function showSummary(
  ctx: BotContext,
  draft: CheckoutDraft,
): Promise<void> {
  const session = ctx.userSession;
  const currency = session.cart[0]?.currency ?? 'UZS';
  const lines = session.cart
    .map((line) => {
      const sub = formatPrice(line.price_amount * line.quantity, line.currency);
      return `- ${line.display_name} x ${line.quantity} (${sub})`;
    })
    .join('\n');
  const totalText = formatPrice(cartTotal(session), currency);
  const infoParts: string[] = [];
  if (draft.mode === 'dine_in' && draft.table_number) {
    infoParts.push(`Table: ${draft.table_number}`);
  }
  if (draft.mode === 'delivery') {
    if (draft.phone) infoParts.push(`Phone: ${draft.phone}`);
    if (draft.address) infoParts.push(`Address: ${draft.address}`);
  }
  const body = infoParts.length > 0 ? `${lines}\n\n${infoParts.join('\n')}` : lines;
  await ctx.reply(
    t('checkout.summary', ctx.lang, { body, total: totalText }),
    confirmKeyboard(ctx.lang),
  );
}
