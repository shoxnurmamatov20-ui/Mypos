export { AnalyticsBoot } from './client-init';
export {
  type EventName,
  identify,
  initPosthogWeb,
  type PosthogConfig,
  reset,
  track,
} from './posthog';
export { initSentryWeb, type SentryConfig } from './sentry';
