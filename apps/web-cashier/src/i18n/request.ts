import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

type Messages = AbstractIntlMessages;

/**
 * Locales other than the default (uz) gracefully fall back to ru when a key
 * is missing — Russian is the lingua franca across Central Asia, so kz/ky/tg
 * readers get a safer fallback than uz transliteration. The active locale is
 * deep-merged ON TOP of ru so present keys still win.
 */
async function loadMessagesWithFallback(locale: string): Promise<Messages> {
  const active = ((await import(`../../messages/${locale}.json`)) as { default: Messages })
    .default;
  if (locale === 'ru' || locale === routing.defaultLocale) {
    return active;
  }
  const ru = ((await import('../../messages/ru.json')) as { default: Messages }).default;
  return deepMerge(ru, active);
}

function deepMerge(base: Messages, over: Messages): Messages {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const baseV = out[k];
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      baseV &&
      typeof baseV === 'object' &&
      !Array.isArray(baseV)
    ) {
      out[k] = deepMerge(baseV as Messages, v as Messages);
    } else {
      out[k] = v;
    }
  }
  return out as Messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: await loadMessagesWithFallback(locale),
  };
});
