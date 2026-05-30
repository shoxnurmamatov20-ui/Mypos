'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;
type FaqKey = (typeof FAQ_KEYS)[number];

function answerKey(key: FaqKey): string {
  return key.replace('q', 'a');
}

export default function HelpPage() {
  const t = useTranslations('help_page');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [openKey, setOpenKey] = useState<FaqKey | null>(null);

  const toggle = (key: FaqKey) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <Link
          href={`/${locale}/profile` as Route}
          aria-label={tCommon('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-neutral-900 sm:text-3xl">
          {t('title')}
        </h1>
      </header>

      <ul className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {FAQ_KEYS.map((key, idx) => {
          const isOpen = openKey === key;
          const isLast = idx === FAQ_KEYS.length - 1;
          return (
            <li key={key} className={isLast ? '' : 'border-b border-neutral-100'}>
              <FaqRow
                question={t(key)}
                answer={t(answerKey(key))}
                open={isOpen}
                onToggle={() => toggle(key)}
              />
            </li>
          );
        })}
      </ul>

      <ContactCard
        title={t('contact_title')}
        phone={t('phone')}
        email={t('email')}
        telegram={t('telegram')}
        hours={t('hours')}
      />
    </div>
  );
}

type FaqRowProps = {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
};

function FaqRow({ question, answer, open, onToggle }: FaqRowProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-neutral-50"
      >
        <span className="flex-1 text-base font-semibold text-neutral-900">{question}</span>
        <ChevronDown
          className={
            open
              ? 'h-5 w-5 shrink-0 rotate-180 text-neutral-400 transition'
              : 'h-5 w-5 shrink-0 text-neutral-400 transition'
          }
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type ContactCardProps = {
  title: string;
  phone: string;
  email: string;
  telegram: string;
  hours: string;
};

function ContactCard({ title, phone, email, telegram, hours }: ContactCardProps) {
  return (
    <section className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
      <h3 className="font-display text-lg font-extrabold text-neutral-900">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        <li>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 text-sm font-semibold text-neutral-900 transition hover:text-brand-600"
          >
            <Phone className="h-5 w-5 text-brand-500" aria-hidden="true" />
            <span>{phone}</span>
          </a>
        </li>
        <li>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 text-sm font-semibold text-neutral-900 transition hover:text-brand-600"
          >
            <Mail className="h-5 w-5 text-brand-500" aria-hidden="true" />
            <span>{email}</span>
          </a>
        </li>
        <li>
          <a
            href={`https://t.me/${telegram.replace(/^@/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm font-semibold text-neutral-900 transition hover:text-brand-600"
          >
            <MessageCircle className="h-5 w-5 text-brand-500" aria-hidden="true" />
            <span>{telegram}</span>
          </a>
        </li>
        <li className="flex items-center gap-3 text-sm text-neutral-600">
          <span aria-hidden="true">🕒</span>
          <span>{hours}</span>
        </li>
      </ul>
    </section>
  );
}
