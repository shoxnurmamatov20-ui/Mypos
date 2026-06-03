/**
 * Sentry initialization helper.
 *
 * Each app calls `initSentry()` at the top of its root layout with its own
 * DSN. Shared sample rate, environment tagging, and PII scrubbing live here
 * so apps can't accidentally leak customer data into Sentry events.
 *
 * The Sentry SDK is loaded via a runtime string-key import so this package
 * has zero hard deps on @sentry/*. Each consumer app installs only the
 * variant it needs (e.g. web-dashboard ships @sentry/nextjs).
 */

export interface SentryConfig {
  /** DSN from Sentry project settings. Read from env: SENTRY_DSN / EXPO_PUBLIC_SENTRY_DSN. */
  dsn: string;
  /** App slug for environment tag ("web-dashboard", "mobile-staff", etc.). */
  app: string;
  /** Release version — usually `pkg.version` or git SHA. */
  release?: string;
  /** Deployment environment: "production" | "staging" | "development". */
  environment?: string;
  /** Performance trace sample rate, 0–1. Default 0.05 (5%). */
  tracesSampleRate?: number;
  /** Replay sample rate on error, 0–1. Default 0.1 (10%). Web only. */
  replaysOnErrorSampleRate?: number;
}

type SentryLike = {
  init: (cfg: Record<string, unknown>) => unknown;
};

async function dynamicImport(name: string): Promise<SentryLike | null> {
  try {
    const mod = (await new Function('m', 'return import(m)')(name)) as { default?: SentryLike } & SentryLike;
    return (mod.default ?? mod) as SentryLike;
  } catch {
    return null;
  }
}

/**
 * Init Sentry for web (Next.js / vanilla). Returns the configured Hub or null
 * if Sentry is not installed in the consumer app.
 */
export async function initSentryWeb(cfg: SentryConfig): Promise<SentryLike | null> {
  if (!cfg.dsn) return null;
  const Sentry =
    (await dynamicImport('@sentry/nextjs')) ?? (await dynamicImport('@sentry/browser'));
  if (!Sentry) return null;
  Sentry.init({
    dsn: cfg.dsn,
    release: cfg.release,
    environment: cfg.environment ?? 'production',
    tracesSampleRate: cfg.tracesSampleRate ?? 0.05,
    replaysOnErrorSampleRate: cfg.replaysOnErrorSampleRate ?? 0.1,
    beforeSend(event: { user?: Record<string, unknown> }) {
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    },
    initialScope: { tags: { app: cfg.app } },
  });
  return Sentry;
}
