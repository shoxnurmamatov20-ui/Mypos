import { t } from '../i18n.js';
import type { BotContext } from '../types.js';

export async function helpCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(t('help.text', ctx.lang));
  await ctx.answerCbQuery().catch(() => undefined);
}
