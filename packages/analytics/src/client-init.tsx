'use client';

import { useEffect } from 'react';
import { initSentryWeb, type SentryConfig } from './sentry';
import { initPosthogWeb, type PosthogConfig } from './posthog';

interface AnalyticsBootProps {
  sentry?: Partial<SentryConfig>;
  posthog?: Partial<PosthogConfig>;
  app: string;
}

/**
 * Mount once near the root of a Next.js app to bootstrap Sentry + PostHog.
 *
 * Reads env at runtime — if a DSN / API key is missing the corresponding
 * SDK is silently skipped. Safe to render even in development.
 */
export function AnalyticsBoot({ sentry, posthog, app }: AnalyticsBootProps) {
  useEffect(() => {
    const sentryDsn = sentry?.dsn ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';
    const sentryRelease = sentry?.release ?? process.env.NEXT_PUBLIC_RELEASE ?? undefined;
    if (sentryDsn) {
      void initSentryWeb({
        dsn: sentryDsn,
        app,
        release: sentryRelease,
        environment:
          sentry?.environment ?? process.env.NEXT_PUBLIC_DEPLOY_ENV ?? 'production',
        tracesSampleRate: sentry?.tracesSampleRate,
        replaysOnErrorSampleRate: sentry?.replaysOnErrorSampleRate,
      });
    }

    const phKey = posthog?.apiKey ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
    if (phKey) {
      void initPosthogWeb({
        apiKey: phKey,
        host: posthog?.host ?? process.env.NEXT_PUBLIC_POSTHOG_HOST,
        app,
        capturePageviews: posthog?.capturePageviews ?? true,
      });
    }
  }, [app, sentry, posthog]);

  return null;
}
