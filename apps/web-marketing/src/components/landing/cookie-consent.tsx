'use client';

import { Cookie } from '@phosphor-icons/react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mypos_cookie_consent_v1';

type Consent = 'all' | 'essential' | null;

export function CookieConsent() {
  const locale = useLocale();
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === 'all' || stored === 'essential') {
      setConsent(stored);
    }
    setMounted(true);
  }, []);

  if (!mounted || consent) return null;

  const handleAccept = (value: 'all' | 'essential') => {
    localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie ruxsati"
      className="fixed bottom-3 inset-x-3 z-50 mx-auto max-w-[34rem] sm:inset-x-auto sm:left-auto sm:right-5 sm:bottom-5"
      style={{
        animation: 'cookieSlideUp 320ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="glass-card flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-2xl py-2.5 pl-3.5 pr-3">
        <Cookie size={18} weight="fill" className="shrink-0 text-[#5eead4]" />

        <p className="min-w-[9rem] flex-1 text-[12.5px] leading-snug text-white/75">
          Cookie&apos;lardan foydalanamiz — <span className="text-white">reklama yo&apos;q.</span>{' '}
          <Link
            href={`/${locale}/cookies`}
            className="text-[#5eead4] underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Sozlamalar
          </Link>
        </p>

        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <button
            type="button"
            onClick={() => handleAccept('essential')}
            className="press h-8 flex-1 whitespace-nowrap rounded-full px-3 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white sm:flex-none"
          >
            Faqat zarur
          </button>
          <button
            type="button"
            onClick={() => handleAccept('all')}
            className="press h-8 flex-1 whitespace-nowrap rounded-full bg-[#ff0037] px-4 text-[12px] font-bold text-white shadow-[0_8px_22px_-8px_rgba(255,0,55,0.55)] transition-colors hover:bg-[#e6002f] sm:flex-none"
          >
            Qabul qilish
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
