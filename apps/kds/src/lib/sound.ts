'use client';

/**
 * New-ticket chime — a short two-tone beep synthesised with the Web
 * Audio API so the Kitchen panel needs no audio asset and no network
 * fetch. The first call lazily creates a shared `AudioContext`; on a
 * fresh kitchen tablet that context starts `suspended` until the cook
 * first taps the screen, after which every chime plays.
 */

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Play the chime at `volume` (0–1). Silently no-ops if audio is blocked. */
export function playChime(volume = 0.7): void {
  const audio = getContext();
  if (!audio) return;

  // Autoplay policy: the context may be suspended until a user gesture.
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

/** Buzz the device, when supported, for a new ticket. */
export function vibrateOnce(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(180);
  }
}
