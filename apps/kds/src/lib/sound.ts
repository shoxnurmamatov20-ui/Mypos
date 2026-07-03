'use client';

/**
 * New-ticket chime — a short two-tone beep synthesised with the Web
 * Audio API so the Kitchen panel needs no audio asset and no network
 * fetch.
 *
 * Browser autoplay policy: audio/vibration are only allowed after the
 * first user gesture. We arm a one-time `pointerdown`/`keydown`
 * listener and hold every chime/buzz until then — this keeps the
 * console free of "AudioContext was not allowed to start" /
 * "Blocked call to navigator.vibrate" noise on a freshly booted
 * kitchen tablet, without changing behaviour after the cook's first
 * tap.
 */

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let unlocked = false;
let armed = false;

function armUnlockListener(): void {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const unlock = (): void => {
    unlocked = true;
    // Resume (or lazily create) the context inside the gesture handler —
    // the only moment the autoplay policy guarantees it will succeed.
    const audio = getContext();
    if (audio?.state === 'suspended') {
      void audio.resume().catch(() => undefined);
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
}

// Arm as soon as the module loads on the client so the cook's very first
// tap unlocks audio even when it happens before any ticket arrives.
if (typeof window !== 'undefined') {
  armUnlockListener();
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !unlocked) return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/**
 * Play the chime at `volume` (0–1). Silently no-ops until the first user
 * gesture unlocks audio (browser autoplay policy).
 */
export function playChime(volume = 0.7): void {
  armUnlockListener();
  const audio = getContext();
  if (!audio) return;

  if (audio.state === 'suspended') {
    void audio.resume().catch(() => undefined);
  }

  const clamped = Math.max(0, Math.min(1, volume));
  const now = audio.currentTime;

  // Two short notes (A5 → E6) — bright enough to cut through a kitchen.
  for (const [freq, start] of [
    [880, 0],
    [1318.5, 0.16],
  ] as const) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, clamped * 0.6), now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.14);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now + start);
    osc.stop(now + start + 0.16);
  }
}

/**
 * Buzz the device, when supported, for a new ticket. No-ops until the
 * first user gesture (browsers block vibration before interaction and
 * log a console error we'd rather not spam the KDS with).
 */
export function vibrateOnce(): void {
  armUnlockListener();
  if (!unlocked) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(180);
  }
}
