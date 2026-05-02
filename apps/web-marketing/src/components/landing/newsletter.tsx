'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, CircleNotch, Envelope } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * Apple-style newsletter capture — pearl input pill, coral submit pill.
 */
export function Newsletter() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    await new Promise((r) => setTimeout(r, 1200));
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <div className="rounded-card bg-canvas p-md shadow-hairline-ring">
      <div className="mb-md flex items-start gap-xs">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pearl bg-coral-tint">
          <Envelope size={20} weight="duotone" className="text-coral" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-body-strong text-ink font-display font-semibold">{t('title')}</h3>
          <p className="mt-xxs text-fine-print text-ink-muted-48">{t('subtitle')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-xs rounded-pearl bg-success-soft px-md py-xs"
          >
            <CheckCircle size={20} weight="fill" className="shrink-0 text-success-text" aria-hidden="true" />
            <p className="text-caption text-success-text">{t('success')}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex gap-xs"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {t('placeholder')}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              className="min-w-0 flex-1 rounded-pill bg-parchment px-md py-xs text-body text-ink transition focus:bg-canvas focus:shadow-focus focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center justify-center gap-xxs rounded-pill bg-tenant px-md py-xs text-caption-strong text-tenant-on-primary transition-transform duration-fast active:scale-95 disabled:opacity-60"
            >
              {status === 'submitting' ? (
                <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
              ) : (
                t('subscribe')
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
