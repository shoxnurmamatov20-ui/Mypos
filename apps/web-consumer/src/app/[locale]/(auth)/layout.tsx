import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

/**
 * Shared layout for `/login`, `/register`, `/forgot-password`.
 *
 * Split design:
 *   - On `lg+`: brand panel (left) + form column (right)
 *   - On mobile: just the form column, with a compact brand strip on top
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });

  const decorEmojis = ['🍔', '🍕', '🥤', '🍣', '🍜', '🥘', '🍱', '🍩'];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel — hidden on mobile */}
      <aside
        aria-hidden="true"
        className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-purple-700 px-12 lg:flex"
      >
        {/* Decorative emoji grid */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-4 grid-rows-6 opacity-15">
          {decorEmojis.concat(decorEmojis, decorEmojis).map((emoji, i) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={`decor-${i}`}
              className="flex items-center justify-center text-5xl"
              style={{ transform: `rotate(${((i * 23) % 60) - 30}deg)` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* Soft glow */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-purple-400/30 blur-3xl" />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/30">
            <span className="text-4xl" aria-hidden="true">
              🍽️
            </span>
          </div>
          <h2 className="mt-8 font-display text-7xl font-extrabold tracking-tight text-white">
            MyPOS
          </h2>
          <p className="mt-4 max-w-md text-2xl font-medium leading-relaxed text-white/90">
            {t('tagline')}
          </p>
          <div className="mt-10 flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/20">
            <span className="h-2 w-2 animate-pulse rounded-full bg-mint-400" />
            <span>1000+ restoran · 50K+ buyurtma</span>
          </div>
        </div>
      </aside>

      {/* Mobile brand strip */}
      <div className="flex items-center justify-center bg-gradient-to-r from-brand-500 to-purple-600 px-6 py-6 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <span className="text-xl" aria-hidden="true">
              🍽️
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-extrabold leading-none text-white">
              MyPOS
            </span>
            <span className="mt-1 text-xs text-white/80">{t('tagline')}</span>
          </div>
        </div>
      </div>

      {/* Form column */}
      <main className="flex flex-1 items-center justify-center bg-white">
        <div className="mx-auto w-full max-w-md px-6 py-10 sm:py-16">{children}</div>
      </main>
    </div>
  );
}
