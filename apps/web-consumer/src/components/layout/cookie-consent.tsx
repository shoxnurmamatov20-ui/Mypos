'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mypos_consumer_cookie_consent';

type ConsentLevel = 'all' | 'essential';

export function CookieConsent() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = (level: ConsentLevel) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, level);
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md md:bottom-6"
          role="dialog"
          aria-live="polite"
          aria-label={t('title')}
        >
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl shadow-neutral-900/20">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                <Cookie className="h-5 w-5 text-brand-700" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-neutral-900">{t('title')}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t('message')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept('all')}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    {t('accept_all')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept('essential')}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:border-neutral-400"
                  >
                    {t('essential_only')}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAccept('essential')}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label={t('close')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
