'use client';

import { Check } from 'lucide-react';
import type { TimelineStepDescriptor } from '@/lib/order-timeline';

type Props = {
  steps: TimelineStepDescriptor[];
};

/**
 * Vertical 5-step timeline with dot + connector. Past steps are filled
 * mint, the active row has a pulsing brand dot, future rows are muted.
 */
export function StatusTimeline({ steps }: Props) {
  return (
    <ol className="relative flex flex-col gap-6">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <li key={step.key} className="relative flex items-start gap-4">
            <TimelineDot state={step.state} isLast={isLast} />
            <div className="flex-1 pb-1">
              <p
                className={
                  step.state === 'future'
                    ? 'text-base font-medium text-neutral-400'
                    : 'text-base font-bold text-neutral-900'
                }
              >
                {step.name}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type DotProps = {
  state: TimelineStepDescriptor['state'];
  isLast: boolean;
};

function TimelineDot({ state, isLast }: DotProps) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={
          state === 'past'
            ? 'flex h-8 w-8 items-center justify-center rounded-full bg-mint-500 text-white'
            : state === 'current'
              ? 'flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 ring-4 ring-brand-500/20'
              : 'h-8 w-8 rounded-full border-2 border-neutral-200 bg-white'
        }
      >
        {state === 'past' ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : state === 'current' ? (
          <span className="block h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
        ) : null}
      </div>
      {!isLast ? (
        <div
          className={
            state === 'past' ? 'mt-1 h-12 w-0.5 bg-mint-500' : 'mt-1 h-12 w-0.5 bg-neutral-200'
          }
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
