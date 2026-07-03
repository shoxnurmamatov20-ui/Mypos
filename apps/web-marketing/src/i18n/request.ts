import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * Phase 4 fallback strategy:
 *   - Locales other than the default (uz) gracefully fall back to ru when a
 *     key is missing. Russian is the lingua franca across Central Asia, so
 *     this gives kz/ky/tg readers a safer fallback than uz transliteration.
 *   - We deep-merge the active locale ON TOP of ru so present keys still win.
 */
async function loadMessagesWithFallback(locale: string): Promise<Record<string, unknown>> {
  const active = (
    (await import(`../../messages/${locale}.json`)) as { default: Record<string, unknown> }
  ).default;
  if (locale === 'ru' || locale === routing.defaultLocale) {
    return active;
  }
  const ru = ((await import(`../../messages/ru.json`)) as { default: Record<string, unknown> })
    .default;
  return deepMerge(ru, active);
}

function deepMerge(
  base: Record<string, unknown>,
  over: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const baseV = out[k];
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      baseV &&
      typeof baseV === 'object' &&
      !Array.isArray(baseV)
    ) {
      out[k] = deepMerge(baseV as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await loadMessagesWithFallback(locale)) as unknown as AbstractIntlMessages,
  };
});
