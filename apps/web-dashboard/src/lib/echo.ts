/**
 * web-dashboard Reverb client.
 *
 * Subscribes to `tenant.{tenantId}.dashboard` for cross-resource live events
 * (new orders, payments, low-stock alerts, new reviews, shift events).
 * Lazy-init pattern matches kds/src/lib/echo.ts.
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const REVERB_KEY = process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? 'mypos-key-local';
const REVERB_HOST = process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost';
const REVERB_PORT = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? '8080');
const REVERB_SCHEME = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const FORCE_TLS = REVERB_SCHEME === 'https';

type EchoChannel = {
  listen: (event: string, callback: (data: unknown) => void) => EchoChannel;
  stopListening: (event: string) => EchoChannel;
};

type EchoInstance = {
  channel: (name: string) => EchoChannel;
  private: (name: string) => EchoChannel;
  leave: (name: string) => void;
  disconnect: () => void;
};

type EchoConstructor = new (config: Record<string, unknown>) => EchoInstance;

let instance: EchoInstance | null = null;

function ensureInstance(token: string): EchoInstance {
  if (instance) return instance;
  (globalThis as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  const Ctor = Echo as unknown as EchoConstructor;
  instance = new Ctor({
    broadcaster: 'reverb',
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: FORCE_TLS,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${API_BASE}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
  return instance;
}

export interface DashboardEventPayload {
  id: string;
  type: string;
  data: Record<string, unknown>;
  occurred_at: string;
}

export interface DashboardHandlers {
  onOrderPlaced?: (payload: DashboardEventPayload) => void;
  onPaymentCaptured?: (payload: DashboardEventPayload) => void;
  onLowStockAlert?: (payload: { ingredient_id: string; current: number; min: number }) => void;
  onShiftEvent?: (payload: { type: 'start' | 'end'; employee_id: string }) => void;
  onReviewPosted?: (payload: { rating: number; order_id: string }) => void;
}

export function subscribeToDashboard(
  tenantId: string,
  token: string,
  handlers: DashboardHandlers,
): () => void {
  const echo = ensureInstance(token);
  const name = `tenant.${tenantId}.dashboard`;
  const channel = echo.private(name);

  if (handlers.onOrderPlaced) {
    channel.listen('.order.placed', (d) => handlers.onOrderPlaced?.(d as DashboardEventPayload));
  }
  if (handlers.onPaymentCaptured) {
    channel.listen('.payment.captured', (d) =>
      handlers.onPaymentCaptured?.(d as DashboardEventPayload),
    );
  }
  if (handlers.onLowStockAlert) {
    channel.listen('.inventory.low_stock', (d) =>
      handlers.onLowStockAlert?.(d as { ingredient_id: string; current: number; min: number }),
    );
  }
  if (handlers.onShiftEvent) {
    channel.listen('.shift.event', (d) =>
      handlers.onShiftEvent?.(d as { type: 'start' | 'end'; employee_id: string }),
    );
  }
  if (handlers.onReviewPosted) {
    channel.listen('.review.posted', (d) =>
      handlers.onReviewPosted?.(d as { rating: number; order_id: string }),
    );
  }

  return () => {
    channel.stopListening('.order.placed');
    channel.stopListening('.payment.captured');
    channel.stopListening('.inventory.low_stock');
    channel.stopListening('.shift.event');
    channel.stopListening('.review.posted');
    echo.leave(name);
  };
}

export function disconnectDashboardEcho(): void {
  instance?.disconnect();
  instance = null;
}
