import { SUPPORTED_LANGS, t } from '../i18n.js';
import { languageKeyboard, mainMenuKeyboard } from '../keyboards.js';
import { setLang } from '../services/user-session.js';
import type { BotContext, Lang } from '../types.js';

export async function languageCommand(ctx: BotContext): Promise<void> {
  const lang = ctx.lang;
  const kb = languageKeyboard();
  try {
    await ctx.editMessageText(t('language.choose', lang), kb);
  } catch {
    await ctx.reply(t('language.choose', lang), kb);
  }
  await ctx.answerCbQuery().catch(() => undefined);
}

export async function setLanguageAction(ctx: BotContext, next: string): Promise<void> {
  if (!isLang(next)) {
    await ctx.answerCbQuery().catch(() => undefined);
    return;
  }
  const userId = ctx.from?.id;
  if (userId === undefined) return;
  setLang(userId, next);
  ctx.userSession.lang = next;
  ctx.lang = next;
  ctx.session.lang = next;
  const kb = mainMenuKeyboard(ctx.userSession);
  try {
    await ctx.editMessageText(t('language.changed', next), kb);
  } catch {
    await ctx.reply(t('language.changed', next), kb);
  }
  await ctx.answerCbQuery().catch(() => undefined);
}

function isLang(value: string): value is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}
