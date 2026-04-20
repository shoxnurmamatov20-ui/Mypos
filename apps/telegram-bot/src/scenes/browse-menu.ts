import { Scenes } from 'telegraf';
import type { BotContext } from '../types.js';
import {
  showCategories,
  showCategoryItems,
  showItemDetail,
} from '../commands/menu.js';

/**
 * A lightweight scene kept for future stateful browsing flows (pagination,
 * back-stack, breadcrumbs). For MVP we render everything via shared helpers
 * in `commands/menu.ts`; the scene only exists so consumers can `scene.enter`
 * when deeper state is needed.
 */
export const BROWSE_SCENE_ID = 'browse-menu';

export function buildBrowseMenuScene(): Scenes.BaseScene<BotContext> {
  const scene = new Scenes.BaseScene<BotContext>(BROWSE_SCENE_ID);

  scene.enter(async (ctx) => {
    await showCategories(ctx);
  });

  scene.action(/^menu:cat:([\w-]+)$/, async (ctx) => {
    const id = ctx.match[1];
    if (id === undefined) return;
    ctx.scene.session.browse = { category_id: id };
    await showCategoryItems(ctx, id);
  });

  scene.action(/^menu:item:([\w-]+)$/, async (ctx) => {
    const id = ctx.match[1];
    if (id === undefined) return;
    await showItemDetail(ctx, id);
  });

  scene.action('menu:open', async (ctx) => {
    await showCategories(ctx);
  });

  return scene;
}
