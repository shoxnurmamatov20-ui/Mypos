'use client';

type Props = {
  divider: string;
  googleLabel: string;
  appleLabel: string;
  comingSoonLabel: string;
};

export function SocialLogin({ divider, googleLabel, appleLabel, comingSoonLabel }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-sm font-medium text-neutral-400">{divider}</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled
          title={comingSoonLabel}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          <span>{googleLabel}</span>
        </button>
        <button
          type="button"
          disabled
          title={comingSoonLabel}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AppleIcon />
          <span>{appleLabel}</span>
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="#000">
      <path d="M16.37 12.6c-.02-2.4 1.96-3.55 2.05-3.6-1.12-1.63-2.86-1.86-3.48-1.88-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.03-3.13.94-3.96 2.4-1.7 2.94-.43 7.27 1.21 9.65.81 1.16 1.76 2.46 3 2.42 1.21-.05 1.66-.78 3.12-.78 1.46 0 1.86.78 3.13.76 1.3-.02 2.11-1.18 2.9-2.34.92-1.34 1.3-2.65 1.32-2.71-.03-.02-2.53-.97-2.55-3.86Zm-2.4-7.06c.66-.81 1.11-1.92.99-3.04-.96.04-2.13.64-2.81 1.44-.61.71-1.15 1.85-1 2.94 1.07.08 2.15-.54 2.82-1.34Z" />
    </svg>
  );
}
