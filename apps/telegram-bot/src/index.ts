import { buildBot } from './bot.js';
import { config } from './config.js';
import { startWebAppServer } from './webapp-server.js';

/**
 * Entry point. Validates env, boots the bot, and wires up graceful shutdown.
 * We intentionally do NOT require `TELEGRAM_BOT_TOKEN` at type/build time —
 * it is only needed at runtime, so typecheck passes without secrets.
 */
async function main(): Promise<void> {
  const cfg = config();
  if (!cfg.TELEGRAM_BOT_TOKEN) {
    console.error('X TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }
  const bot = buildBot(cfg.TELEGRAM_BOT_TOKEN);
  const stopWebApp = startWebAppServer(cfg.WEBAPP_PORT);

  await bot.launch({ dropPendingUpdates: true });
  console.log('OK MyPOS Telegram bot is running.');

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`! received ${signal}, shutting down...`);
    bot.stop(signal);
    try {
      await stopWebApp();
    } catch (err) {
      console.error('X webapp shutdown error:', err);
    }
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('X fatal boot error:', err);
  process.exit(1);
});
