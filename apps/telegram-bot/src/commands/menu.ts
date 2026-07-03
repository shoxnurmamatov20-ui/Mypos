import { t } from '../i18n.js';
import { categoriesKeyboard, itemDetailKeyboard, itemsKeyboard } from '../keyboards.js';
import { findItem, listCategories, listItemsByCategory } from '../services/menu-service.js';
import type { BotContext, InlineKb } from '../types.js';

export async function menuCommand(ctx: BotContext): Promise<void> {
  await showCategories(ctx);
}

export async function showCategories(ctx: BotContext): Promise<void> {
  const lang = ctx.lang;
  const categories = await listCategories();
  if (categories.length === 0) {
    await ctx.reply(t('menu.empty', lang));
    return;
  }
  const kb = categoriesKeyboard(categories, lang);
  const text = t('menu.pick_category', lang);
  await safeRender(ctx, text, kb);
}

export async function showCategoryItems(ctx: BotContext, categoryId: string): Promise<void> {
  const lang = ctx.lang;
  const items = await listItemsByCategory(categoryId);
  if (items.length === 0) {
    await ctx.reply(t('menu.empty', lang));
    return;
  }
  const kb = itemsKeyboard(items, lang);
  const text = t('menu.pick_item', lang);
  await safeRender(ctx, text, kb);
}

export async function showItemDetail(ctx: BotContext, itemId: string): Promise<void> {
  const lang = ctx.lang;
  const item = await findItem(itemId);
  if (item === null) {
    await ctx.answerCbQuery(t('errors.menu_unavailable', lang)).catch(() => undefined);
    return;
  }
  const name = item.name[lang] || item.name.uz;
  const desc = (item.description && (item.description[lang] || item.description.uz)) || '';
  const priceLabel = `${item.price.effective_amount} ${item.price.currency}`;
  const body = desc ? `*${name}*\n${desc}\n\n${priceLabel}` : `*${name}*\n${priceLabel}`;
  const kb = itemDetailKeyboard(item.id, lang);
  if (item.image_url) {
    await ctx.replyWithPhoto(item.image_url, {
      caption: body,
      parse_mode: 'Markdown',
      ...kb,
    });
  } else {
    await ctx.reply(body, { parse_mode: 'Markdown', ...kb });
  }
  await ctx.answerCbQuery().catch(() => undefined);
}

async function safeRender(ctx: BotContext, text: string, kb: InlineKb): Promise<void> {
  try {
    await ctx.editMessageText(text, kb);
  } catch {
    await ctx.reply(text, kb);
  }
  await ctx.answerCbQuery().catch(() => undefined);
}
