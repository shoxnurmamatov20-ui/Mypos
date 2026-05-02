// apps/pos-terminal/src/hooks/useReverbChannel.ts
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────

const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST ?? 'localhost';
const REVERB_PORT = process.env.EXPO_PUBLIC_REVERB_PORT ?? '8080';
const REVERB_APP_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? 'mypos-key-local';
const MAX_RETRIES = 5;
const RECONNECT_DELAY_MS = 5_000;

// ─── Types ────────────────────────────────────────────────────────────────────

type PusherMessage = {
  event: string;
  data?: unknown;
  channel?: string;
};

export type UseReverbChannelOptions = {
  channel: string;
  onEvent: (event: string, data: unknown) => void;
  enabled?: boolean;
};

export type UseReverbChannelResult = {
  isConnected: boolean;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReverbChannel({
  channel,
  onEvent,
  enabled = true,
}: UseReverbChannelOptions): UseReverbChannelResult {
  const [isConnected, setIsConnected] = useState(false);

  // Mutable refs — never trigger re-renders, always up-to-date in callbacks.
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef(channel);
  const onEventRef = useRef(onEvent);
  const enabledRef = useRef(enabled);

  // Keep refs current on every render without re-creating `connect`.
  channelRef.current = channel;
  onEventRef.current = onEvent;
  enabledRef.current = enabled;

  const connect = useCallback(() => {
    if (!enabledRef.current) return;

    const url =
      `ws://${REVERB_HOST}:${REVERB_PORT}/app/${REVERB_APP_KEY}` +
      `?protocol=7&client=js&version=7.6.0`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
    };

    ws.onmessage = (e: MessageEvent<string>) => {
      let msg: PusherMessage;
      try {
        msg = JSON.parse(e.data) as PusherMessage;
      } catch {
        // Ignore non-JSON frames.
        return;
      }

      switch (msg.event) {
        case 'pusher:connection_established':
          ws.send(
            JSON.stringify({
              event: 'pusher:subscribe',
              data: { channel: channelRef.current },
            }),
          );
          break;

        case 'pusher_internal:subscription_succeeded':
          setIsConnected(true);
          break;

        case 'pusher:ping':
          ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
          break;

        default:
          // Forward non-Pusher-protocol events to the caller.
          if (msg.event && !msg.event.startsWith('pusher')) {
            onEventRef.current(msg.event, msg.data ?? null);
          }
          break;
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (retriesRef.current < MAX_RETRIES && enabledRef.current) {
        retriesRef.current += 1;
        timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, []);
  // `connect` has no deps — all mutable state lives in refs.

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, connect]);

  return { isConnected };
}
