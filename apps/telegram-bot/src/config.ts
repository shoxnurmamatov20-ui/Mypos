import 'dotenv/config';
import { z } from 'zod';

/**
 * Validates `process.env` once at startup so the rest of the code can treat
 * config as a plain typed object. Keep this file small & side-effect-free
 * apart from reading env.
 */
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  MYPOS_API_URL: z.string().url().default('http://localhost:58000'),
  MYPOS_TENANT_SLUG: z.string().min(1).default('demo-restaurant'),
  MYPOS_API_TOKEN: z.string().optional(),
  WEBAPP_PORT: z.coerce.number().int().positive().default(3009),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

/** Memoised singleton — call once per process. */
let cached: AppConfig | null = null;
export function config(): AppConfig {
  if (cached === null) cached = loadConfig();
  return cached;
}
