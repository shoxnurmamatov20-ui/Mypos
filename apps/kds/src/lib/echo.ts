/**
 * KDS Reverb client — subscribes to `tenant.{tenantId}.kitchen` private channel.
 *
 * Pattern adapted from mobile-consumer for web. Lazy-init: Echo is constructed
 * on the first subscribe call so cold page loads don't open a useless WS.
 *
 * Auth: the `auth` config below sends the Sanctum bearer token to
 * `/api/broadcasting/auth` so the backend can verify the user has the kitchen
 * role for the requested tenant (see `routes/channels.php`).
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
  // Register Pusher on globalThis so Echo can find it.
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

export type KitchenOrderPayload = {
  id: string;
  tenant_id: string;
  order_no: string;
  type: string;
  status: string;
  table_id: string | null;
  table_no: string | null;
  items_count: number;
  total_amount: number;
  currency: string;
  placed_at: string | null;
};

export type KitchenSubscriptionHandlers = {
  onOrderPlaced?: (payload: KitchenOrderPayload) => void;
  onOrderStatusChanged?: (payload: { id: string; new_status: string }) => void;
};

/**
 * Subscribe to a tenant's kitchen channel. Returns an unsubscribe function.
 *
 * @param tenantId — tenant UUID; subscribes to `tenant.{tenantId}.kitchen`
 * @param token    — Sanctum bearer token (from localStorage)
 * @param handlers — event callbacks
 */
export function subscribeToKitchen(
  tenantId: string,
  token: string,
  handlers: KitchenSubscriptionHandlers,
): () => void {
  const echo = ensureInstance(token);
  const channelName = `tenant.${tenantId}.kitchen`;
  const channel = echo.private(channelName);

  if (handlers.onOrderPlaced) {
    channel.listen('.order.placed', (data) => {
      handlers.onOrderPlaced?.(data as KitchenOrderPayload);
    });
  }

  if (handlers.onOrderStatusChanged) {
    channel.listen('.order.status.changed', (data) => {
      handlers.onOrderStatusChanged?.(data as { id: string; new_status: string });
    });
  }

  return () => {
    channel.stopListening('.order.placed');
    channel.stopListening('.order.status.changed');
    echo.leave(channelName);
  };
}

export function disconnectEcho(): void {
  instance?.disconnect();
  instance = null;
}
