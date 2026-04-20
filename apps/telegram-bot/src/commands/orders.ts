import { t } from '../i18n.js';
import { formatPrice } from '../keyboards.js';
import { listRecentOrders } from '../services/order-service.js';
import type { BotContext } from '../types.js';

export async function ordersCommand(ctx: BotContext): Promise<void> {
  const lang = ctx.lang;
  let orders;
  try {
    orders = await listRecentOrders();
  } catch (error) {
    console.error('X orders fetch failed:', error);
    await ctx.reply(t('errors.network', lang));
    return;
  }
  if (orders.length === 0) {
    await ctx.reply(t('orders.empty', lang));
    return;
  }
  const lines = orders
    .map((o) =>
      t('orders.line', lang, {
        no: o.order_no,
        status: o.status,
        total: formatPrice(o.amounts.total, o.amounts.currency),
      }),
    )
    .join('\n');
  await ctx.reply(`*${t('orders.title', lang)}*\n\n${lines}`, {
    parse_mode: 'Markdown',
  });
  await ctx.answerCbQuery().catch(() => undefined);
}
