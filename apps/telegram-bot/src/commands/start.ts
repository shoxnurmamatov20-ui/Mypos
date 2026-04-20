import { t } from '../i18n.js';
import { mainMenuKeyboard } from '../keyboards.js';
import type { BotContext } from '../types.js';

export async function startCommand(ctx: BotContext): Promise<void> {
  const lang = ctx.lang;
  const kb = mainMenuKeyboard(ctx.userSession);
  await ctx.reply(t('welcome', lang), kb);
}

export async function homeAction(ctx: BotContext): Promise<void> {
  const lang = ctx.lang;
  const kb = mainMenuKeyboard(ctx.userSession);
  try {
    await ctx.editMessageText(t('welcome', lang), kb);
  } catch {
    // Message may be too old to edit; fall back to a fresh reply.
    await ctx.reply(t('welcome', lang), kb);
  }
  await ctx.answerCbQuery().catch(() => undefined);
}
