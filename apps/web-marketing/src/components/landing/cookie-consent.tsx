'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mypos_cookie_consent';

/**
 * Apple-style cookie consent — frosted canvas card, hairline ring,
 * coral pill primary / pearl pill secondary.
 */
export function CookieConsent() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = (level: 'all' | 'essential') => {
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
          className="fixed bottom-md left-md right-md z-50 sm:bottom-lg sm:left-auto sm:right-lg sm:max-w-md"
          role="dialog"
          aria-live="polite"
        >
          <div className="rounded-card bg-canvas p-md shadow-hairline-ring">
            <div className="flex items-start gap-xs">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pearl bg-coral-tint">
                <Cookie className="h-5 w-5 text-coral" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h3 className="text-body-strong text-ink font-display font-semibold">
                  {t('title')}
                </h3>
                <p className="mt-xxs text-caption text-ink-muted-80">{t('message')}</p>
                <div className="mt-md flex flex-wrap gap-xs">
                  <button
                    type="button"
                    onClick={() => handleAccept('all')}
                    className="rounded-pill bg-tenant px-md py-xs text-caption-strong text-tenant-on-primary transition-transform duration-fast active:scale-95"
                  >
                    {t('accept_all')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept('essential')}
                    className="rounded-pill bg-pearl px-md py-xs text-caption-strong text-ink shadow-hairline-ring transition-transform duration-fast active:scale-95"
                  >
                    {t('essential_only')}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAccept('essential')}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pearl text-ink-muted-48 transition-colors duration-fast hover:bg-parchment hover:text-ink"
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
