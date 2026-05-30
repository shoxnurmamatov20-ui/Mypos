'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success';

export function Newsletter() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Placeholder — wired to backend in a follow-up.
    await new Promise((r) => setTimeout(r, 1000));
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <div className="rounded-2xl border border-neutral-700 bg-neutral-800/60 p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-white">{t('title')}</h3>
          <p className="mt-0.5 text-xs text-neutral-400">{t('subtitle')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-mint-500/40 bg-mint-500/10 px-4 py-3"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-mint-400" aria-hidden="true" />
            <p className="text-sm font-medium text-mint-300">{t('success')}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
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
              className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {status === 'submitting' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
