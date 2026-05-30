/**
 * Pure helpers for the order tracking screen.
 *
 * Build the 5-step status timeline + ETA strings based on `placedAt` and
 * the current time. No DOM, no React — trivially unit-testable.
 *
 * Mirrors `apps/mobile-consumer/src/lib/orderTimeline.ts` 1:1 but typed
 * against the web `MockOrderStatus` from `@/lib/save-order`.
 */

import type { MockOrderStatus } from '@/lib/save-order';

export type TimelineState = 'past' | 'current' | 'future';

export type StepKey = MockOrderStatus;

/** Minute offsets (from placedAt) at which each step *starts*. */
export const STEP_OFFSETS_MIN: Record<StepKey, number> = {
  pending: 0,
  preparing: 2,
  ready: 7,
  on_the_way: 15,
  delivered: 25,
};

export const STEP_ORDER: readonly StepKey[] = [
  'pending',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
] as const;

function statusIndex(status: MockOrderStatus): number {
  const idx = STEP_ORDER.indexOf(status);
  return idx < 0 ? 0 : idx;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "HH:mm" formatter (24h). */
export function formatHHmm(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export type TimelineStepLabels = {
  pending: string;
  preparing: string;
  ready: string;
  on_the_way: string;
  delivered: string;
  /** "Hozir bo'lyapti" / "В процессе" / "In progress". */
  inProgress: string;
  /** Renders e.g. "~5 daqiqada" given a minute count. */
  approxMinutes: (minutes: number) => string;
};

export type TimelineStepDescriptor = {
  key: StepKey;
  name: string;
  detail: string;
  state: TimelineState;
};

/** Build all five timeline rows for the given placedAt + current status. */
export function buildTimelineSteps(
  placedAt: Date,
  status: MockOrderStatus,
  now: Date,
  labels: TimelineStepLabels,
): TimelineStepDescriptor[] {
  const currentIdx = statusIndex(status);
  return STEP_ORDER.map((key, idx) => {
    const offsetMs = STEP_OFFSETS_MIN[key] * 60_000;
    const stepTime = new Date(placedAt.getTime() + offsetMs);
    let state: TimelineState;
    if (idx < currentIdx) state = 'past';
    else if (idx === currentIdx) state = 'current';
    else state = 'future';

    let detail: string;
    if (state === 'past') {
      detail = formatHHmm(stepTime);
    } else if (state === 'current') {
      detail = labels.inProgress;
    } else {
      const remainingMin = Math.max(
        1,
        Math.ceil((stepTime.getTime() - now.getTime()) / 60_000),
      );
      detail = labels.approxMinutes(remainingMin);
    }

    return {
      key,
      name: labels[key],
      detail,
      state,
    };
  });
}

/**
 * Minutes remaining until delivery. Returns 0 for delivered orders or if
 * placedAt is in the future / invalid.
 */
export function computeEtaMinutes(
  placedAt: Date,
  status: MockOrderStatus,
  now: Date,
): number {
  if (status === 'delivered') return 0;
  const deliveredAtMs = placedAt.getTime() + STEP_OFFSETS_MIN.delivered * 60_000;
  const remainingMs = deliveredAtMs - now.getTime();
  if (remainingMs <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMs / 60_000));
}
