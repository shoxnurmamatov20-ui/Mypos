/**
 * PostHog event tracker.
 *
 * Lightweight wrapper around posthog-js (web) and posthog-react-native (mobile)
 * that exposes a single `track()` API and lazy-loads the SDK so the analytics
 * library never blocks first paint.
 *
 * The Posthog SDK is loaded via a runtime string-key import so this package
 * has zero hard deps on posthog-*. Each consumer app installs the variant
 * it needs.
 */

export interface PosthogConfig {
  apiKey: string;
  host?: string;
  app: string;
  capturePageviews?: boolean;
}

export type EventName =
  | 'login.success'
  | 'login.failed'
  | 'order.placed'
  | 'order.cancelled'
  | 'menu.item.viewed'
  | 'menu.item.added_to_cart'
  | 'checkout.started'
  | 'checkout.completed'
  | 'payment.success'
  | 'payment.failed'
  | 'review.submitted'
  | 'tenant.brand.updated'
  | 'app.crash'
  | 'feature.used';

type PosthogClient = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
};

type PosthogModule = {
  default?: PosthogClient & { init: (key: string, opts: Record<string, unknown>) => void };
  init?: (key: string, opts: Record<string, unknown>) => void;
};

async function dynamicImport(name: string): Promise<PosthogModule | null> {
  try {
    return (await new Function('m', 'return import(m)')(name)) as PosthogModule;
  } catch {
    return null;
  }
}

let client: PosthogClient | null = null;

export async function initPosthogWeb(cfg: PosthogConfig): Promise<PosthogClient | null> {
  if (!cfg.apiKey) return null;
  const mod = await dynamicImport('posthog-js');
  if (!mod) return null;
  const posthog = (mod.default ?? mod) as PosthogClient & {
    init: (key: string, opts: Record<string, unknown>) => void;
  };
  posthog.init(cfg.apiKey, {
    api_host: cfg.host ?? 'https://app.posthog.com',
    capture_pageview: cfg.capturePageviews ?? true,
    autocapture: false,
    person_profiles: 'identified_only',
  });
  client = posthog;
  return client;
}

export function track(event: EventName, props: Record<string, unknown> = {}): void {
  if (!client) return;
  try {
    client.capture(event, props);
  } catch {
    /* swallow — analytics failure never crashes the app */
  }
}

export function identify(userId: string, traits: Record<string, unknown> = {}): void {
  if (!client) return;
  try {
    client.identify(userId, traits);
  } catch {
    /* swallow */
  }
}

export function reset(): void {
  if (!client) return;
  try {
    client.reset();
  } catch {
    /* swallow */
  }
}
