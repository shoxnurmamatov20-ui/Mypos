import { Scenes, session, Telegraf } from 'telegraf';
import { cartCommand, renderCart } from './commands/cart.js';
import { helpCommand } from './commands/help.js';
import { languageCommand, setLanguageAction } from './commands/language.js';
import { menuCommand, showCategoryItems, showItemDetail } from './commands/menu.js';
import { ordersCommand } from './commands/orders.js';
import { homeAction, startCommand } from './commands/start.js';
import { t } from './i18n.js';
import { buildBrowseMenuScene } from './scenes/browse-menu.js';
import { buildCheckoutScene, CHECKOUT_SCENE_ID } from './scenes/checkout.js';
import { findItem } from './services/menu-service.js';
import { addToCart, clearCart, getSession, removeFromCart } from './services/user-session.js';
import type { BotContext, BotSceneSession, BotSession } from './types.js';

/** Build & configure the Telegraf instance. Does NOT call `bot.launch()`. */
export function buildBot(token: string): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(token);

  bot.use(session({ defaultSession: (): BotSession => ({ __scenes: {} }) }));

  const stage = new Scenes.Stage<BotContext, BotSceneSession>([
    buildBrowseMenuScene(),
    buildCheckoutScene(),
  ]);
  bot.use(stage.middleware());

  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (userId === undefined || chatId === undefined) return next();
    const s = getSession(userId, chatId);
    if (ctx.session.lang !== undefined) s.lang = ctx.session.lang;
    ctx.session.lang = s.lang;
    ctx.userSession = s;
    ctx.lang = s.lang;
    return next();
  });

  registerCommands(bot);
  registerActions(bot);
  registerErrorHandler(bot);

  return bot;
}

function registerCommands(bot: Telegraf<BotContext>): void {
  bot.start(startCommand);
  bot.command('menu', menuCommand);
  bot.command('savat', cartCommand);
  bot.command('buyurtmalarim', ordersCommand);
  bot.command('til', languageCommand);
  bot.command('help', helpCommand);
}

function registerActions(bot: Telegraf<BotContext>): void {
  bot.action('home', homeAction);
  bot.action('help:show', helpCommand);

  bot.action('menu:open', async (ctx) => {
    await menuCommand(ctx);
  });
  bot.action(/^menu:cat:([\w-]+)$/, async (ctx) => {
    const id = ctx.match[1];
    if (id === undefined) return;
    await showCategoryItems(ctx, id);
  });
  bot.action(/^menu:item:([\w-]+)$/, async (ctx) => {
    const id = ctx.match[1];
    if (id === undefined) return;
    await showItemDetail(ctx, id);
  });

  bot.action('cart:open', async (ctx) => {
    await renderCart(ctx);
  });
  bot.action(/^cart:add:([\w-]+)$/, async (ctx) => {
    const id = ctx.match[1];
    const userId = ctx.from?.id;
    if (id === undefined || userId === undefined) return;
    const item = await findItem(id);
    if (item === null) {
      await ctx.answerCbQuery(t('errors.menu_unavailable', ctx.lang)).catch(() => undefined);
      return;
    }
    const display = item.name[ctx.lang] || item.name.uz;
    addToCart(userId, {
      menu_item_id: item.id,
      name: display,
      display_name: display,
      price_amount: item.price.effective_amount,
      currency: item.price.currency,
      quantity: 1,
    });
    await ctx.answerCbQuery(`+1 ${display}`).catch(() => undefined);
  });
  bot.action(/^cart:rm:([\w-]+)$/, async (ctx) => {
    const id = ctx.match[1];
    const userId = ctx.from?.id;
    if (id === undefined || userId === undefined) return;
    removeFromCart(userId, id);
    await renderCart(ctx);
  });
  bot.action('cart:clear', async (ctx) => {
    const userId = ctx.from?.id;
    if (userId === undefined) return;
    clearCart(userId);
    await renderCart(ctx);
  });
  bot.action('cart:checkout', async (ctx) => {
    await ctx.answerCbQuery().catch(() => undefined);
    if (ctx.userSession.cart.length === 0) {
      await ctx.reply(t('cart.empty', ctx.lang));
      return;
    }
    await ctx.scene.enter(CHECKOUT_SCENE_ID);
  });

  bot.action('orders:list', ordersCommand);

  bot.action('lang:open', languageCommand);
  bot.action(/^lang:set:(uz|ru|en)$/, async (ctx) => {
    const next = ctx.match[1];
    if (next === undefined) return;
    await setLanguageAction(ctx, next);
  });
}

function registerErrorHandler(bot: Telegraf<BotContext>): void {
  bot.catch(async (err, ctx) => {
    console.error('X telegraf error:', err);
    try {
      const lang = ctx.lang ?? 'uz';
      await ctx.reply(t('errors.generic', lang));
    } catch (replyErr) {
      console.error('X failed to notify user about error:', replyErr);
    }
  });
}
