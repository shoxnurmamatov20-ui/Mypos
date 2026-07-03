import { t } from '../i18n.js';
import { cartKeyboard, formatPrice } from '../keyboards.js';
import { cartTotal } from '../services/user-session.js';
import type { BotContext, InlineKb } from '../types.js';

export async function cartCommand(ctx: BotContext): Promise<void> {
  await renderCart(ctx);
}

export async function renderCart(ctx: BotContext): Promise<void> {
  const lang = ctx.lang;
  const session = ctx.userSession;
  if (session.cart.length === 0) {
    const kb = cartKeyboard(session);
    await safeRender(ctx, t('cart.empty', lang), kb);
    return;
  }
  const currency = session.cart[0]?.currency ?? 'UZS';
  const lines = session.cart
    .map((line, idx) =>
      t('cart.line', lang, {
        i: idx + 1,
        name: line.display_name,
        qty: line.quantity,
        total: formatPrice(line.price_amount * line.quantity, line.currency),
      }),
    )
    .join('\n');
  const total = t('cart.total', lang, {
    total: formatPrice(cartTotal(session), currency),
  });
  const body = `*${t('cart.title', lang)}*\n\n${lines}\n\n${total}`;
  const kb = cartKeyboard(session);
  await safeRender(ctx, body, kb);
}

async function safeRender(ctx: BotContext, text: string, kb: InlineKb): Promise<void> {
  try {
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...kb });
  } catch {
    await ctx.reply(text, { parse_mode: 'Markdown', ...kb });
  }
  await ctx.answerCbQuery().catch(() => undefined);
}
